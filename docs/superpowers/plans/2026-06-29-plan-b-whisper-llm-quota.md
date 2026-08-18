# Plan B: Whisper 전사 + LLM 요약 + AI 쿼터 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 오디오 청크를 받아 OpenAI Whisper로 실시간 전사하고, 회의 종료 시 GPT-4o-mini로 마크다운 회의록을 자동 생성한다. Redis 기반 AI 쿼터로 사용자/회의별 과금을 제한한다.

**Architecture:** `TranscriptService`가 `@Async`로 Whisper API를 호출하고 결과를 DB에 저장한다. `MinutesService`가 전체 transcript를 모아 GPT에 요청한다. `AiQuotaService`가 Redis INCR로 쿼터를 카운팅하고, `AiQuotaInterceptor`가 AI 엔드포인트에서 선제 차단한다.

**Tech Stack:** Spring Boot 4.0.5, Java 21, Spring `@Async`, `RestClient` (Spring 6.1+), Redis (`StringRedisTemplate`), JUnit 5 + Mockito

**선행 조건:** Plan A 완료 (MeetingRoom, MeetingTranscript, MeetingMinutes 엔티티 및 마이그레이션)

## Global Constraints

- 비동기: `@Async("transcriptExecutor")` — 전용 스레드 풀 사용
- OpenAI 호출: `RestClient` (WebFlux 불필요) — 동기 블로킹으로 Async 스레드에서 실행
- Whisper API 제한: 파일 25MB, 청크 최대 30초
- Redis 키 TTL: Whisper daily는 자정까지, LLM monthly는 월말까지
- 쿼터 초과 응답: HTTP 429, `ErrorCode.AI_QUOTA_EXCEEDED`

---

### Task 1: AsyncConfig + MeetingTranscript/MeetingMinutes 엔티티

**Files:**
- Create: `backend/src/main/java/com/hyend/config/AsyncConfig.java`
- Create: `backend/src/main/java/com/hyend/entity/MeetingTranscript.java`
- Create: `backend/src/main/java/com/hyend/entity/MeetingMinutes.java`
- Create: `backend/src/main/java/com/hyend/repository/MeetingTranscriptRepository.java`
- Create: `backend/src/main/java/com/hyend/repository/MeetingMinutesRepository.java`

**Interfaces:**
- Produces:
  - `MeetingTranscript.of(room, speakerUser, text, chunkIndex): MeetingTranscript`
  - `MeetingMinutes.of(room, content): MeetingMinutes`
  - `MeetingTranscriptRepository.findByRoomIdOrderByChunkIndex(roomId): List<MeetingTranscript>`
  - `MeetingMinutesRepository.findByRoomId(roomId): Optional<MeetingMinutes>`

- [ ] **Step 1: AsyncConfig 구현**

```java
// AsyncConfig.java
package com.hyend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "transcriptExecutor")
    public Executor transcriptExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("transcript-");
        executor.initialize();
        return executor;
    }
}
```

- [ ] **Step 2: MeetingTranscript 엔티티 구현**

```java
// MeetingTranscript.java
package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_transcripts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MeetingTranscript {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private MeetingRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "speaker_user_id")
    private User speaker;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(nullable = false)
    private int chunkIndex;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public static MeetingTranscript of(MeetingRoom room, User speaker, String text, int chunkIndex) {
        MeetingTranscript t = new MeetingTranscript();
        t.room = room;
        t.speaker = speaker;
        t.text = text;
        t.chunkIndex = chunkIndex;
        t.createdAt = LocalDateTime.now();
        return t;
    }
}
```

- [ ] **Step 3: MeetingMinutes 엔티티 구현**

```java
// MeetingMinutes.java
package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_minutes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MeetingMinutes {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false, unique = true)
    private MeetingRoom room;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private boolean isEdited = false;

    @Column(nullable = false)
    private LocalDateTime generatedAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public static MeetingMinutes of(MeetingRoom room, String content) {
        MeetingMinutes m = new MeetingMinutes();
        m.room = room;
        m.content = content;
        m.generatedAt = LocalDateTime.now();
        m.updatedAt = LocalDateTime.now();
        return m;
    }

    public void update(String content) {
        this.content = content;
        this.isEdited = true;
        this.updatedAt = LocalDateTime.now();
    }

    public void regenerate(String content) {
        this.content = content;
        this.isEdited = false;
        this.generatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
```

- [ ] **Step 4: Repository 구현**

```java
// MeetingTranscriptRepository.java
package com.hyend.repository;

import com.hyend.entity.MeetingTranscript;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MeetingTranscriptRepository extends JpaRepository<MeetingTranscript, Long> {
    List<MeetingTranscript> findByRoomIdOrderByChunkIndex(Long roomId);
    long countByRoomId(Long roomId);
}
```

```java
// MeetingMinutesRepository.java
package com.hyend.repository;

import com.hyend.entity.MeetingMinutes;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MeetingMinutesRepository extends JpaRepository<MeetingMinutes, Long> {
    Optional<MeetingMinutes> findByRoomId(Long roomId);
}
```

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/com/hyend/config/AsyncConfig.java \
        backend/src/main/java/com/hyend/entity/MeetingTranscript.java \
        backend/src/main/java/com/hyend/entity/MeetingMinutes.java \
        backend/src/main/java/com/hyend/repository/MeetingTranscriptRepository.java \
        backend/src/main/java/com/hyend/repository/MeetingMinutesRepository.java
git commit -m "feat: add AsyncConfig and Transcript/Minutes entities with repositories"
```

---

### Task 2: AiQuotaService (Redis 쿼터 관리)

**Files:**
- Create: `backend/src/main/java/com/hyend/service/AiQuotaService.java`
- Create: `backend/src/test/java/com/hyend/service/AiQuotaServiceTest.java`

**Interfaces:**
- Consumes: `StringRedisTemplate`
- Produces:
  - `checkAndConsumeWhisper(userId: Long, meetingId: Long, durationSeconds: int): void` — 초과 시 `BusinessException(AI_QUOTA_EXCEEDED)`
  - `consumeLlmTokens(userId: Long, meetingId: Long, tokenCount: int): void`
  - `getRemainingWhisperSeconds(userId: Long): long`
  - `incrementLlmMeetingCount(meetingId: Long): long`
  - `getLlmMeetingCount(meetingId: Long): long`

- [ ] **Step 1: 테스트 작성**

```java
// AiQuotaServiceTest.java
package com.hyend.service;

import com.hyend.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiQuotaServiceTest {

    @Mock StringRedisTemplate redisTemplate;
    @Mock ValueOperations<String, String> valueOps;
    @InjectMocks AiQuotaService aiQuotaService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        ReflectionTestUtils.setField(aiQuotaService, "whisperDailySeconds", 3600L);
        ReflectionTestUtils.setField(aiQuotaService, "whisperMeetingMaxSeconds", 10800L);
        ReflectionTestUtils.setField(aiQuotaService, "llmMeetingMaxCount", 3L);
    }

    @Test
    void checkAndConsumeWhisper_throwsException_whenDailyQuotaExceeded() {
        // 이미 3600초 사용한 상태
        when(valueOps.increment(contains("daily"), eq(30L))).thenReturn(3630L);

        assertThatThrownBy(() -> aiQuotaService.checkAndConsumeWhisper(1L, 10L, 30))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void checkAndConsumeWhisper_succeeds_whenWithinQuota() {
        when(valueOps.increment(contains("daily"), eq(30L))).thenReturn(30L);
        when(valueOps.increment(contains("meeting"), eq(30L))).thenReturn(30L);

        // 예외 없이 통과해야 함
        aiQuotaService.checkAndConsumeWhisper(1L, 10L, 30);
    }
}
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.AiQuotaServiceTest" 2>&1 | tail -5
```

- [ ] **Step 3: AiQuotaService 구현**

```java
// AiQuotaService.java
package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AiQuotaService {

    private final StringRedisTemplate redisTemplate;

    @Value("${ai.quota.whisper-daily-seconds}") private long whisperDailySeconds;
    @Value("${ai.quota.whisper-meeting-max-seconds}") private long whisperMeetingMaxSeconds;
    @Value("${ai.quota.llm-monthly-tokens}") private long llmMonthlyTokens;
    @Value("${ai.quota.llm-meeting-max-count}") private long llmMeetingMaxCount;

    public void checkAndConsumeWhisper(Long userId, Long meetingId, int durationSeconds) {
        String dailyKey = "ai:whisper:user:%d:daily".formatted(userId);
        String meetingKey = "ai:whisper:meeting:%d".formatted(meetingId);

        Long dailyTotal = redisTemplate.opsForValue().increment(dailyKey, durationSeconds);
        setTtlUntilMidnight(dailyKey);

        if (dailyTotal != null && dailyTotal > whisperDailySeconds) {
            // 롤백
            redisTemplate.opsForValue().increment(dailyKey, -durationSeconds);
            throw new BusinessException(ErrorCode.AI_QUOTA_EXCEEDED);
        }

        Long meetingTotal = redisTemplate.opsForValue().increment(meetingKey, durationSeconds);
        redisTemplate.expire(meetingKey, 7, TimeUnit.DAYS);

        if (meetingTotal != null && meetingTotal > whisperMeetingMaxSeconds) {
            redisTemplate.opsForValue().increment(dailyKey, -durationSeconds);
            redisTemplate.opsForValue().increment(meetingKey, -durationSeconds);
            throw new BusinessException(ErrorCode.AI_QUOTA_EXCEEDED);
        }
    }

    public void consumeLlmTokens(Long userId, Long meetingId, int tokenCount) {
        String monthlyKey = "ai:llm:user:%d:monthly".formatted(userId);
        redisTemplate.opsForValue().increment(monthlyKey, tokenCount);
        setTtlUntilEndOfMonth(monthlyKey);
    }

    public long incrementLlmMeetingCount(Long meetingId) {
        String countKey = "ai:llm:meeting:%d:count".formatted(meetingId);
        Long count = redisTemplate.opsForValue().increment(countKey, 1);
        redisTemplate.expire(countKey, 7, TimeUnit.DAYS);
        return count == null ? 0 : count;
    }

    public long getLlmMeetingCount(Long meetingId) {
        String countKey = "ai:llm:meeting:%d:count".formatted(meetingId);
        String val = redisTemplate.opsForValue().get(countKey);
        return val == null ? 0 : Long.parseLong(val);
    }

    public long getRemainingWhisperSeconds(Long userId) {
        String dailyKey = "ai:whisper:user:%d:daily".formatted(userId);
        String val = redisTemplate.opsForValue().get(dailyKey);
        long used = val == null ? 0 : Long.parseLong(val);
        return Math.max(0, whisperDailySeconds - used);
    }

    private void setTtlUntilMidnight(String key) {
        LocalDateTime midnight = LocalDate.now().plusDays(1).atStartOfDay();
        long seconds = Duration.between(LocalDateTime.now(), midnight).getSeconds();
        redisTemplate.expire(key, seconds, TimeUnit.SECONDS);
    }

    private void setTtlUntilEndOfMonth(String key) {
        LocalDate lastDay = LocalDate.now().with(TemporalAdjusters.lastDayOfMonth());
        LocalDateTime endOfMonth = lastDay.atTime(23, 59, 59);
        long seconds = Duration.between(LocalDateTime.now(), endOfMonth).getSeconds();
        redisTemplate.expire(key, seconds, TimeUnit.SECONDS);
    }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.AiQuotaServiceTest"
```

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/com/hyend/service/AiQuotaService.java \
        backend/src/test/java/com/hyend/service/AiQuotaServiceTest.java
git commit -m "feat: add AiQuotaService with Redis-based per-user/meeting quota tracking"
```

---

### Task 3: OpenAiClient (Whisper + GPT RestClient 래퍼)

**Files:**
- Create: `backend/src/main/java/com/hyend/config/OpenAiConfig.java`
- Create: `backend/src/main/java/com/hyend/client/OpenAiClient.java`
- Create: `backend/src/test/java/com/hyend/client/OpenAiClientTest.java`

**Interfaces:**
- Produces:
  - `OpenAiClient.transcribe(audioBytes: byte[], filename: String): String` — Whisper 전사 결과
  - `OpenAiClient.summarize(transcriptText: String): String` — GPT 요약 마크다운
  - `OpenAiClient.estimateTokenCount(text: String): int` — 문자 수 기반 토큰 추정

- [ ] **Step 1: OpenAiConfig 구현**

```java
// OpenAiConfig.java
package com.hyend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class OpenAiConfig {

    @Value("${openai.api-key}")
    private String apiKey;

    @Bean(name = "openAiRestClient")
    public RestClient openAiRestClient() {
        return RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }
}
```

- [ ] **Step 2: OpenAiClient 테스트 작성**

```java
// OpenAiClientTest.java
package com.hyend.client;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OpenAiClientTest {

    @Mock RestClient openAiRestClient;
    @InjectMocks OpenAiClient openAiClient;

    @Test
    void estimateTokenCount_returnsApproximation() {
        // 4글자당 1토큰 근사치
        String text = "a".repeat(400);
        int tokens = openAiClient.estimateTokenCount(text);
        assertThat(tokens).isEqualTo(100);
    }
}
```

- [ ] **Step 3: OpenAiClient 구현**

```java
// OpenAiClient.java
package com.hyend.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAiClient {

    @Qualifier("openAiRestClient")
    private final RestClient restClient;

    @Value("${openai.whisper-model}") private String whisperModel;
    @Value("${openai.gpt-model}") private String gptModel;

    public String transcribe(byte[] audioBytes, String filename) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("model", whisperModel);
        body.add("language", "ko");
        body.add("response_format", "text");
        body.add("file", new ByteArrayResource(audioBytes) {
            @Override public String getFilename() { return filename; }
        });

        return restClient.post()
                .uri("/audio/transcriptions")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(String.class);
    }

    public String summarize(String transcriptText) {
        Map<String, Object> requestBody = Map.of(
                "model", gptModel,
                "messages", List.of(
                        Map.of("role", "system", "content", """
                                당신은 한국어 회의록 작성 전문가입니다.
                                아래 전사 텍스트를 바탕으로 다음 구조의 마크다운 회의록을 작성하세요.
                                
                                ## 회의 개요
                                ## 주요 논의사항
                                ## 결정사항
                                ## 액션 아이템
                                
                                - 발화자 정보가 있으면 이름을 포함하세요.
                                - 반복·잡음 발화는 생략하세요.
                                - 모든 결정사항과 할일은 빠짐없이 포함하세요.
                                """),
                        Map.of("role", "user", "content", transcriptText)
                ),
                "max_tokens", 2000
        );

        Map<?, ?> response = restClient.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        List<?> choices = (List<?>) response.get("choices");
        Map<?, ?> message = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
        return (String) message.get("content");
    }

    public int estimateTokenCount(String text) {
        return text.length() / 4;
    }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.client.OpenAiClientTest"
```

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/com/hyend/config/OpenAiConfig.java \
        backend/src/main/java/com/hyend/client/OpenAiClient.java \
        backend/src/test/java/com/hyend/client/OpenAiClientTest.java
git commit -m "feat: add OpenAiClient for Whisper transcription and GPT summarization"
```

---

### Task 4: TranscriptService (오디오 청크 → Whisper → DB → WebSocket)

**Files:**
- Create: `backend/src/main/java/com/hyend/service/TranscriptService.java`
- Create: `backend/src/test/java/com/hyend/service/TranscriptServiceTest.java`
- Create: `backend/src/main/java/com/hyend/dto/meeting/TranscriptChunkResponse.java`

**Interfaces:**
- Consumes: `OpenAiClient`, `AiQuotaService`, `MeetingTranscriptRepository`, `MeetingRoomRepository`, `UserRepository`, `SimpMessagingTemplate`
- Produces:
  - `processChunk(roomId: Long, userId: Long, audioBytes: byte[], chunkIndex: int, durationSeconds: int): void` — `@Async("transcriptExecutor")`

- [ ] **Step 1: TranscriptChunkResponse DTO 작성**

```java
// TranscriptChunkResponse.java
package com.hyend.dto.meeting;

import java.time.LocalDateTime;

public record TranscriptChunkResponse(
        Long transcriptId,
        Long speakerId,
        String speakerName,
        String text,
        int chunkIndex,
        LocalDateTime createdAt
) {}
```

- [ ] **Step 2: 테스트 작성**

```java
// TranscriptServiceTest.java
package com.hyend.service;

import com.hyend.client.OpenAiClient;
import com.hyend.entity.*;
import com.hyend.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TranscriptServiceTest {

    @Mock OpenAiClient openAiClient;
    @Mock AiQuotaService aiQuotaService;
    @Mock MeetingTranscriptRepository transcriptRepository;
    @Mock MeetingRoomRepository roomRepository;
    @Mock UserRepository userRepository;
    @Mock SimpMessagingTemplate messagingTemplate;
    @InjectMocks TranscriptService transcriptService;

    @Test
    void processChunk_savesTranscriptAndBroadcasts() {
        MeetingRoom room = mock(MeetingRoom.class);
        when(room.getId()).thenReturn(1L);
        when(room.getLivekitRoomName()).thenReturn("room-uuid");
        User user = mock(User.class);
        when(user.getId()).thenReturn(2L);
        when(user.getName()).thenReturn("홍길동");

        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(openAiClient.transcribe(any(), any())).thenReturn("회의 내용입니다.");
        when(transcriptRepository.countByRoomId(1L)).thenReturn(0L);

        MeetingTranscript saved = MeetingTranscript.of(room, user, "회의 내용입니다.", 0);
        when(transcriptRepository.save(any())).thenReturn(saved);

        transcriptService.processChunk(1L, 2L, new byte[]{1, 2, 3}, 0, 5);

        verify(aiQuotaService).checkAndConsumeWhisper(2L, 1L, 5);
        verify(openAiClient).transcribe(any(), eq("chunk-0.webm"));
        verify(transcriptRepository).save(any(MeetingTranscript.class));
        verify(messagingTemplate).convertAndSend(eq("/topic/meetings/1/transcript"), any());
    }
}
```

- [ ] **Step 3: 테스트 실행 — 실패 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.TranscriptServiceTest" 2>&1 | tail -5
```

- [ ] **Step 4: TranscriptService 구현**

```java
// TranscriptService.java
package com.hyend.service;

import com.hyend.client.OpenAiClient;
import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.TranscriptChunkResponse;
import com.hyend.entity.*;
import com.hyend.exception.BusinessException;
import com.hyend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class TranscriptService {

    private final OpenAiClient openAiClient;
    private final AiQuotaService aiQuotaService;
    private final MeetingTranscriptRepository transcriptRepository;
    private final MeetingRoomRepository roomRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Async("transcriptExecutor")
    @Transactional
    public void processChunk(Long roomId, Long userId, byte[] audioBytes,
                             int chunkIndex, int durationSeconds) {
        aiQuotaService.checkAndConsumeWhisper(userId, roomId, durationSeconds);

        MeetingRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
        User speaker = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        String text = openAiClient.transcribe(audioBytes, "chunk-%d.webm".formatted(chunkIndex));
        if (text == null || text.isBlank()) return;

        MeetingTranscript transcript = transcriptRepository.save(
                MeetingTranscript.of(room, speaker, text.trim(), chunkIndex));

        TranscriptChunkResponse response = new TranscriptChunkResponse(
                transcript.getId(),
                speaker.getId(),
                speaker.getName(),
                transcript.getText(),
                transcript.getChunkIndex(),
                transcript.getCreatedAt()
        );

        messagingTemplate.convertAndSend("/topic/meetings/%d/transcript".formatted(roomId), response);
        log.debug("Transcript chunk {} saved for room {}", chunkIndex, roomId);
    }
}
```

- [ ] **Step 5: MeetingController에 transcript 엔드포인트 추가**

`MeetingController.java`에 추가:

```java
// 기존 import에 추가
import com.hyend.service.TranscriptService;
import org.springframework.web.multipart.MultipartFile;

// 필드에 추가
private final TranscriptService transcriptService;

// 메서드 추가
@PostMapping("/{id}/transcript")
public ApiResponse<Void> uploadTranscript(
        @PathVariable Long id,
        @RequestParam("audio") MultipartFile audio,
        @RequestParam("chunkIndex") int chunkIndex,
        @RequestParam("durationSeconds") int durationSeconds,
        @AuthenticationPrincipal UserPrincipal principal) throws IOException {
    transcriptService.processChunk(id, principal.getId(),
            audio.getBytes(), chunkIndex, durationSeconds);
    return ApiResponse.success(null);
}
```

- [ ] **Step 6: 테스트 실행 — 통과 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.TranscriptServiceTest"
```

- [ ] **Step 7: 커밋**

```bash
git add backend/src/main/java/com/hyend/service/TranscriptService.java \
        backend/src/main/java/com/hyend/dto/meeting/TranscriptChunkResponse.java \
        backend/src/main/java/com/hyend/controller/MeetingController.java \
        backend/src/test/java/com/hyend/service/TranscriptServiceTest.java
git commit -m "feat: add TranscriptService with async Whisper processing and WebSocket broadcast"
```

---

### Task 5: MinutesService (회의 종료 → LLM 요약)

**Files:**
- Create: `backend/src/main/java/com/hyend/service/MinutesService.java`
- Create: `backend/src/main/java/com/hyend/dto/meeting/MinutesResponse.java`
- Create: `backend/src/test/java/com/hyend/service/MinutesServiceTest.java`
- Modify: `backend/src/main/java/com/hyend/service/MeetingRoomService.java` (end() 메서드에 MinutesService 연동)
- Modify: `backend/src/main/java/com/hyend/controller/MeetingController.java` (minutes API 추가)

**Interfaces:**
- Consumes: `OpenAiClient`, `AiQuotaService`, `MeetingTranscriptRepository`, `MeetingMinutesRepository`, `MeetingRoomRepository`
- Produces:
  - `generateMinutes(roomId: Long, userId: Long): MinutesResponse`
  - `getMinutes(roomId: Long): MinutesResponse`
  - `updateMinutes(roomId: Long, content: String, userId: Long): MinutesResponse`

- [ ] **Step 1: MinutesResponse DTO 작성**

```java
// MinutesResponse.java
package com.hyend.dto.meeting;

import com.hyend.entity.MeetingMinutes;
import java.time.LocalDateTime;

public record MinutesResponse(
        Long id,
        Long roomId,
        String content,
        boolean isEdited,
        LocalDateTime generatedAt,
        LocalDateTime updatedAt
) {
    public static MinutesResponse from(MeetingMinutes m) {
        return new MinutesResponse(
                m.getId(),
                m.getRoom().getId(),
                m.getContent(),
                m.isEdited(),
                m.getGeneratedAt(),
                m.getUpdatedAt()
        );
    }
}
```

- [ ] **Step 2: 테스트 작성**

```java
// MinutesServiceTest.java
package com.hyend.service;

import com.hyend.client.OpenAiClient;
import com.hyend.dto.meeting.MinutesResponse;
import com.hyend.entity.*;
import com.hyend.exception.BusinessException;
import com.hyend.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MinutesServiceTest {

    @Mock OpenAiClient openAiClient;
    @Mock AiQuotaService aiQuotaService;
    @Mock MeetingTranscriptRepository transcriptRepository;
    @Mock MeetingMinutesRepository minutesRepository;
    @Mock MeetingRoomRepository roomRepository;
    @InjectMocks MinutesService minutesService;

    @Test
    void generateMinutes_callsGptAndSavesResult() {
        MeetingRoom room = mock(MeetingRoom.class);
        when(room.getId()).thenReturn(1L);
        when(room.isEnded()).thenReturn(true);

        MeetingTranscript t1 = mock(MeetingTranscript.class);
        when(t1.getText()).thenReturn("안녕하세요");
        User speaker = mock(User.class);
        when(speaker.getName()).thenReturn("홍길동");
        when(t1.getSpeaker()).thenReturn(speaker);

        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(transcriptRepository.findByRoomIdOrderByChunkIndex(1L)).thenReturn(List.of(t1));
        when(openAiClient.summarize(anyString())).thenReturn("## 회의 개요\n요약 내용");
        when(openAiClient.estimateTokenCount(anyString())).thenReturn(100);
        when(minutesRepository.findByRoomId(1L)).thenReturn(Optional.empty());

        MeetingMinutes saved = MeetingMinutes.of(room, "## 회의 개요\n요약 내용");
        when(minutesRepository.save(any())).thenReturn(saved);

        MinutesResponse response = minutesService.generateMinutes(1L, 42L);

        assertThat(response.content()).contains("회의 개요");
        verify(aiQuotaService).consumeLlmTokens(eq(42L), eq(1L), anyInt());
    }

    @Test
    void generateMinutes_throwsException_whenQuotaExceeded() {
        MeetingRoom room = mock(MeetingRoom.class);
        when(room.getId()).thenReturn(1L);
        when(room.isEnded()).thenReturn(true);
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(aiQuotaService.getLlmMeetingCount(1L)).thenReturn(3L);

        ReflectionTestUtils.setField(minutesService, "llmMeetingMaxCount", 3L);

        assertThatThrownBy(() -> minutesService.generateMinutes(1L, 42L))
                .isInstanceOf(BusinessException.class);
    }
}
```

- [ ] **Step 3: 테스트 실행 — 실패 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.MinutesServiceTest" 2>&1 | tail -5
```

- [ ] **Step 4: MinutesService 구현**

```java
// MinutesService.java
package com.hyend.service;

import com.hyend.client.OpenAiClient;
import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.MinutesResponse;
import com.hyend.entity.*;
import com.hyend.exception.BusinessException;
import com.hyend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MinutesService {

    private final OpenAiClient openAiClient;
    private final AiQuotaService aiQuotaService;
    private final MeetingTranscriptRepository transcriptRepository;
    private final MeetingMinutesRepository minutesRepository;
    private final MeetingRoomRepository roomRepository;

    @Value("${ai.quota.llm-meeting-max-count}") private long llmMeetingMaxCount;

    @Transactional
    public MinutesResponse generateMinutes(Long roomId, Long userId) {
        MeetingRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));

        if (aiQuotaService.getLlmMeetingCount(roomId) >= llmMeetingMaxCount) {
            throw new BusinessException(ErrorCode.AI_QUOTA_EXCEEDED);
        }

        List<MeetingTranscript> transcripts = transcriptRepository.findByRoomIdOrderByChunkIndex(roomId);
        String fullText = transcripts.stream()
                .map(t -> "[%s] %s".formatted(
                        t.getSpeaker() != null ? t.getSpeaker().getName() : "알 수 없음",
                        t.getText()))
                .collect(Collectors.joining("\n"));

        String summary = openAiClient.summarize(fullText);
        int tokenCount = openAiClient.estimateTokenCount(fullText) + openAiClient.estimateTokenCount(summary);
        aiQuotaService.consumeLlmTokens(userId, roomId, tokenCount);
        aiQuotaService.incrementLlmMeetingCount(roomId);

        MeetingMinutes minutes = minutesRepository.findByRoomId(roomId)
                .map(m -> { m.regenerate(summary); return m; })
                .orElseGet(() -> minutesRepository.save(MeetingMinutes.of(room, summary)));

        return MinutesResponse.from(minutes);
    }

    public MinutesResponse getMinutes(Long roomId) {
        return MinutesResponse.from(
                minutesRepository.findByRoomId(roomId)
                        .orElseThrow(() -> new BusinessException(ErrorCode.MINUTES_NOT_FOUND)));
    }

    @Transactional
    public MinutesResponse updateMinutes(Long roomId, String content, Long userId) {
        MeetingMinutes minutes = minutesRepository.findByRoomId(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MINUTES_NOT_FOUND));
        minutes.update(content);
        return MinutesResponse.from(minutes);
    }
}
```

- [ ] **Step 5: MeetingController에 minutes 엔드포인트 추가**

`MeetingController.java`에 추가:

```java
// 필드 추가
private final MinutesService minutesService;

// 메서드 추가
@PostMapping("/{id}/end")  // 기존 end() 메서드 교체
public ApiResponse<Void> end(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal) {
    meetingRoomService.end(id, principal.getId());
    minutesService.generateMinutes(id, principal.getId()); // 비동기로 실행해도 무방
    return ApiResponse.success(null);
}

@GetMapping("/{id}/minutes")
public ApiResponse<MinutesResponse> getMinutes(@PathVariable Long id) {
    return ApiResponse.success(minutesService.getMinutes(id));
}

@PutMapping("/{id}/minutes")
public ApiResponse<MinutesResponse> updateMinutes(
        @PathVariable Long id,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.success(minutesService.updateMinutes(id, body.get("content"), principal.getId()));
}
```

- [ ] **Step 6: 테스트 실행 — 통과 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.MinutesServiceTest"
```

- [ ] **Step 7: 전체 테스트**

```bash
cd backend && ./gradlew test 2>&1 | tail -10
```

- [ ] **Step 8: 커밋**

```bash
git add backend/src/main/java/com/hyend/service/MinutesService.java \
        backend/src/main/java/com/hyend/dto/meeting/MinutesResponse.java \
        backend/src/main/java/com/hyend/controller/MeetingController.java \
        backend/src/test/java/com/hyend/service/MinutesServiceTest.java
git commit -m "feat: add MinutesService for LLM-based meeting summary generation"
```

---

**Plan B 완료 기준:** `./gradlew test` 전체 통과 + 오디오 청크 업로드 시 Whisper 텍스트가 DB에 저장되고 WebSocket으로 전달됨 + 회의 종료 시 meeting_minutes 레코드 생성 확인
