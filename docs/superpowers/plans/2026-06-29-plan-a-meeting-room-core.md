# Plan A: 회의방 CRUD + LiveKit 연동 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 회의방 생성/참가/퇴장/종료 CRUD와 LiveKit Cloud SFU 토큰 발급까지 동작하는 백엔드 API를 구축한다.

**Architecture:** Spring Boot 모놀리스에 meeting 도메인을 추가한다. LiveKit Java SDK로 방 생성과 참가자 토큰을 발급하고, 회의방 상태(WAITING/ACTIVE/ENDED)를 PostgreSQL에서 관리한다.

**Tech Stack:** Spring Boot 4.0.5, Java 21, PostgreSQL + Flyway, LiveKit Server SDK (Java), Spring Data JPA, JUnit 5 + Mockito

## Global Constraints

- 엔티티 패턴: `@NoArgsConstructor(access = PROTECTED)` + `@Getter` + `static of()` + `extends BaseTimeEntity`
- 서비스 패턴: `@Transactional(readOnly = true)` 기본, 변경 메서드만 `@Transactional`
- 예외: `BusinessException(ErrorCode.XXX)` 사용
- DTO: `record` 또는 정적 `from()` 팩토리
- 테스트: H2 인메모리, Flyway 비활성화(`spring.flyway.enabled=false`)
- 커밋: 태스크 완료마다 즉시 커밋

---

### Task 1: build.gradle 의존성 추가

**Files:**
- Modify: `backend/build.gradle`

**Interfaces:**
- Produces: LiveKit SDK, WebSocket, Firebase Admin 사용 가능한 빌드 환경

- [ ] **Step 1: 의존성 추가**

`dependencies` 블록 내 기존 AWS S3 줄 아래에 추가:

```groovy
// WebSocket (STOMP)
implementation 'org.springframework.boot:spring-boot-starter-websocket'

// LiveKit Server SDK
implementation 'io.livekit:livekit-server:0.6.1'

// Firebase Admin SDK
implementation 'com.google.firebase:firebase-admin:9.4.1'

// OpenAI HTTP Client (RestClient 사용 — 추가 라이브러리 불필요)
// Firebase Admin이 가져오는 Gson과 충돌 방지
configurations.all {
    exclude group: 'com.google.guava', module: 'listenablefuture'
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd backend && ./gradlew dependencies --configuration compileClasspath | grep -E "livekit|websocket|firebase"
```

예상 출력 (일부):
```
+--- io.livekit:livekit-server:0.6.1
+--- org.springframework.boot:spring-boot-starter-websocket:...
+--- com.google.firebase:firebase-admin:9.4.1
```

- [ ] **Step 3: 커밋**

```bash
git add backend/build.gradle
git commit -m "chore: add livekit, websocket, firebase-admin dependencies"
```

---

### Task 2: Flyway 마이그레이션 V14~V17

**Files:**
- Create: `backend/src/main/resources/db/migration/V14__create_meeting_rooms.sql`
- Create: `backend/src/main/resources/db/migration/V15__create_meeting_transcripts.sql`
- Create: `backend/src/main/resources/db/migration/V16__create_meeting_chat.sql`
- Create: `backend/src/main/resources/db/migration/V17__create_user_fcm_tokens.sql`

**Interfaces:**
- Produces: 4개 테이블 스키마 (다른 태스크의 엔티티가 매핑할 대상)

- [ ] **Step 1: V14 작성 — meeting_rooms, meeting_participants**

```sql
-- V14__create_meeting_rooms.sql
CREATE TABLE meeting_rooms (
    id                  BIGSERIAL PRIMARY KEY,
    title               VARCHAR(100)  NOT NULL,
    description         TEXT,
    host_user_id        BIGINT        NOT NULL REFERENCES users(id),
    livekit_room_name   VARCHAR(64)   NOT NULL UNIQUE,
    status              VARCHAR(16)   NOT NULL DEFAULT 'WAITING',
    created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
    ended_at            TIMESTAMP
);

CREATE TABLE meeting_participants (
    id          BIGSERIAL PRIMARY KEY,
    room_id     BIGINT    NOT NULL REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    user_id     BIGINT    NOT NULL REFERENCES users(id),
    joined_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    left_at     TIMESTAMP,
    UNIQUE (room_id, user_id)
);
```

- [ ] **Step 2: V15 작성 — meeting_transcripts, meeting_minutes**

```sql
-- V15__create_meeting_transcripts.sql
CREATE TABLE meeting_transcripts (
    id              BIGSERIAL PRIMARY KEY,
    room_id         BIGINT    NOT NULL REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    speaker_user_id BIGINT    REFERENCES users(id),
    text            TEXT      NOT NULL,
    chunk_index     INT       NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE meeting_minutes (
    id           BIGSERIAL PRIMARY KEY,
    room_id      BIGINT    NOT NULL UNIQUE REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    content      TEXT      NOT NULL,
    is_edited    BOOLEAN   NOT NULL DEFAULT FALSE,
    generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 3: V16 작성 — meeting_chat_messages**

```sql
-- V16__create_meeting_chat.sql
CREATE TABLE meeting_chat_messages (
    id          BIGSERIAL PRIMARY KEY,
    room_id     BIGINT       NOT NULL REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    type        VARCHAR(16)  NOT NULL DEFAULT 'TEXT',
    content     TEXT,
    file_url    TEXT,
    file_name   VARCHAR(255),
    file_size   BIGINT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 4: V17 작성 — user_fcm_tokens**

```sql
-- V17__create_user_fcm_tokens.sql
CREATE TABLE user_fcm_tokens (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token        TEXT         NOT NULL UNIQUE,
    user_agent   VARCHAR(255),
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 5: 앱 기동으로 마이그레이션 적용 확인**

```bash
cd backend && ./gradlew bootRun &
sleep 15
curl -s http://localhost:8080/actuator/health | python3 -m json.tool
kill %1
```

예상 출력: `"status": "UP"`

- [ ] **Step 6: 커밋**

```bash
git add backend/src/main/resources/db/migration/
git commit -m "feat: add meeting room DB migrations (V14-V17)"
```

---

### Task 3: MeetingRoom + MeetingParticipant 엔티티 및 Repository

**Files:**
- Create: `backend/src/main/java/com/hyend/entity/MeetingRoom.java`
- Create: `backend/src/main/java/com/hyend/entity/MeetingParticipant.java`
- Create: `backend/src/main/java/com/hyend/repository/MeetingRoomRepository.java`
- Create: `backend/src/main/java/com/hyend/repository/MeetingParticipantRepository.java`
- Create: `backend/src/test/java/com/hyend/repository/MeetingRoomRepositoryTest.java`

**Interfaces:**
- Produces:
  - `MeetingRoom.of(title, description, host, livekitRoomName): MeetingRoom`
  - `MeetingRoom.Status` enum: `WAITING, ACTIVE, ENDED`
  - `MeetingRoomRepository.findByStatus(Status): List<MeetingRoom>`
  - `MeetingParticipantRepository.findByRoomIdAndLeftAtIsNull(roomId): List<MeetingParticipant>`

- [ ] **Step 1: 테스트 작성**

```java
// MeetingRoomRepositoryTest.java
package com.hyend.repository;

import com.hyend.entity.MeetingRoom;
import com.hyend.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@TestPropertySource(properties = "spring.flyway.enabled=false")
class MeetingRoomRepositoryTest {

    @Autowired TestEntityManager em;
    @Autowired MeetingRoomRepository roomRepository;

    @Test
    void findByStatus_returnsOnlyMatchingRooms() {
        User host = persistUser("host@test.com");
        MeetingRoom active = MeetingRoom.of("활성 회의", null, host, "room-uuid-1");
        active.activate();
        MeetingRoom waiting = MeetingRoom.of("대기 회의", null, host, "room-uuid-2");
        em.persist(active);
        em.persist(waiting);
        em.flush();

        List<MeetingRoom> result = roomRepository.findByStatus(MeetingRoom.Status.ACTIVE);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("활성 회의");
    }

    private User persistUser(String email) {
        User user = User.of(email, "encoded-pw", "테스터", null, null);
        return em.persist(user);
    }
}
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.repository.MeetingRoomRepositoryTest" 2>&1 | tail -10
```

예상: `FAILED` (MeetingRoom 클래스 없음)

- [ ] **Step 3: MeetingRoom 엔티티 구현**

```java
// MeetingRoom.java
package com.hyend.entity;

import com.hyend.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_rooms")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MeetingRoom extends BaseTimeEntity {

    public enum Status { WAITING, ACTIVE, ENDED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_user_id", nullable = false)
    private User host;

    @Column(nullable = false, unique = true, length = 64)
    private String livekitRoomName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status = Status.WAITING;

    private LocalDateTime endedAt;

    public static MeetingRoom of(String title, String description, User host, String livekitRoomName) {
        MeetingRoom room = new MeetingRoom();
        room.title = title;
        room.description = description;
        room.host = host;
        room.livekitRoomName = livekitRoomName;
        room.status = Status.WAITING;
        return room;
    }

    public void activate() { this.status = Status.ACTIVE; }

    public void end() {
        this.status = Status.ENDED;
        this.endedAt = LocalDateTime.now();
    }

    public boolean isHost(Long userId) { return this.host.getId().equals(userId); }

    public boolean isEnded() { return this.status == Status.ENDED; }
}
```

- [ ] **Step 4: MeetingParticipant 엔티티 구현**

```java
// MeetingParticipant.java
package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_participants")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MeetingParticipant {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private MeetingRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();

    private LocalDateTime leftAt;

    public static MeetingParticipant of(MeetingRoom room, User user) {
        MeetingParticipant p = new MeetingParticipant();
        p.room = room;
        p.user = user;
        p.joinedAt = LocalDateTime.now();
        return p;
    }

    public void leave() { this.leftAt = LocalDateTime.now(); }

    public boolean hasLeft() { return this.leftAt != null; }
}
```

- [ ] **Step 5: Repository 구현**

```java
// MeetingRoomRepository.java
package com.hyend.repository;

import com.hyend.entity.MeetingRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MeetingRoomRepository extends JpaRepository<MeetingRoom, Long> {
    List<MeetingRoom> findByStatus(MeetingRoom.Status status);
    List<MeetingRoom> findByHostIdOrderByCreatedAtDesc(Long hostId);
}
```

```java
// MeetingParticipantRepository.java
package com.hyend.repository;

import com.hyend.entity.MeetingParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, Long> {
    List<MeetingParticipant> findByRoomIdAndLeftAtIsNull(Long roomId);
    Optional<MeetingParticipant> findByRoomIdAndUserIdAndLeftAtIsNull(Long roomId, Long userId);
    boolean existsByRoomIdAndUserId(Long roomId, Long userId);
}
```

- [ ] **Step 6: 테스트 실행 — 통과 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.repository.MeetingRoomRepositoryTest"
```

예상: `BUILD SUCCESSFUL`

- [ ] **Step 7: 커밋**

```bash
git add backend/src/main/java/com/hyend/entity/MeetingRoom.java \
        backend/src/main/java/com/hyend/entity/MeetingParticipant.java \
        backend/src/main/java/com/hyend/repository/MeetingRoomRepository.java \
        backend/src/main/java/com/hyend/repository/MeetingParticipantRepository.java \
        backend/src/test/java/com/hyend/repository/MeetingRoomRepositoryTest.java
git commit -m "feat: add MeetingRoom, MeetingParticipant entities and repositories"
```

---

### Task 4: ErrorCode 추가 + application.yml 환경변수

**Files:**
- Modify: `backend/src/main/java/com/hyend/common/ErrorCode.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `.env.example`

**Interfaces:**
- Produces: `ErrorCode.MEETING_NOT_FOUND`, `MEETING_ALREADY_ENDED`, `MEETING_NOT_ACTIVE`, `NOT_MEETING_HOST`, `ALREADY_IN_MEETING`, `AI_QUOTA_EXCEEDED`, `INVITE_NOT_FOUND`

- [ ] **Step 1: ErrorCode에 회의 관련 코드 추가**

`ErrorCode.java`의 `// Business` 섹션 아래에 추가:

```java
// Meeting
MEETING_NOT_FOUND(HttpStatus.NOT_FOUND, "회의방을 찾을 수 없습니다."),
MEETING_ALREADY_ENDED(HttpStatus.CONFLICT, "이미 종료된 회의입니다."),
MEETING_NOT_ACTIVE(HttpStatus.CONFLICT, "진행 중인 회의가 아닙니다."),
NOT_MEETING_HOST(HttpStatus.FORBIDDEN, "회의 개설자만 이 작업을 수행할 수 있습니다."),
ALREADY_IN_MEETING(HttpStatus.CONFLICT, "이미 회의에 참가 중입니다."),
INVITE_NOT_FOUND(HttpStatus.NOT_FOUND, "초대 링크가 유효하지 않거나 만료됐습니다."),
AI_QUOTA_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "AI 사용 할당량을 초과했습니다."),
MINUTES_NOT_FOUND(HttpStatus.NOT_FOUND, "회의록을 찾을 수 없습니다."),
```

- [ ] **Step 2: application.yml에 외부 서비스 설정 추가**

`application.yml` 파일 맨 아래에 추가:

```yaml
livekit:
  api-key: ${LIVEKIT_API_KEY}
  api-secret: ${LIVEKIT_API_SECRET}
  server-url: ${LIVEKIT_SERVER_URL:https://your-project.livekit.cloud}

openai:
  api-key: ${OPENAI_API_KEY}
  whisper-model: whisper-1
  gpt-model: gpt-4o-mini

firebase:
  credentials-path: ${FIREBASE_CREDENTIALS_PATH:}  # 서비스 계정 JSON 경로

ai:
  quota:
    whisper-daily-seconds: 3600        # 사용자당 하루 60분
    whisper-meeting-max-seconds: 10800 # 회의당 최대 3시간
    llm-monthly-tokens: 100000         # 사용자당 월 10만 토큰
    llm-meeting-max-count: 3           # 회의당 요약 재생성 최대 3회

meeting:
  invite:
    default-expire-hours: 24
    max-expire-hours: 168
```

- [ ] **Step 3: .env.example 업데이트**

`.env.example`에 추가:

```
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_SERVER_URL=https://your-project.livekit.cloud
OPENAI_API_KEY=sk-...
FIREBASE_CREDENTIALS_PATH=/app/config/firebase-service-account.json
```

- [ ] **Step 4: 커밋**

```bash
git add backend/src/main/java/com/hyend/common/ErrorCode.java \
        backend/src/main/resources/application.yml \
        .env.example
git commit -m "feat: add meeting ErrorCodes and external service configuration"
```

---

### Task 5: LiveKitConfig + LiveKitService

**Files:**
- Create: `backend/src/main/java/com/hyend/config/LiveKitConfig.java`
- Create: `backend/src/main/java/com/hyend/service/LiveKitService.java`
- Create: `backend/src/test/java/com/hyend/service/LiveKitServiceTest.java`

**Interfaces:**
- Consumes: `livekit.api-key`, `livekit.api-secret`, `livekit.server-url` (from application.yml)
- Produces:
  - `LiveKitService.createRoom(roomName: String): void`
  - `LiveKitService.generateToken(roomName: String, participantIdentity: String, participantName: String): String`

- [ ] **Step 1: 테스트 작성**

```java
// LiveKitServiceTest.java
package com.hyend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class LiveKitServiceTest {

    @InjectMocks
    LiveKitService liveKitService;

    @Test
    void generateToken_returnsNonEmptyJwt() {
        ReflectionTestUtils.setField(liveKitService, "apiKey", "test-key");
        ReflectionTestUtils.setField(liveKitService, "apiSecret", "test-secret-that-is-long-enough-32chars");

        String token = liveKitService.generateToken("room-1", "user-42", "홍길동");

        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3); // JWT 구조 검증
    }
}
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.LiveKitServiceTest" 2>&1 | tail -5
```

예상: `FAILED`

- [ ] **Step 3: LiveKitConfig 구현**

```java
// LiveKitConfig.java
package com.hyend.config;

import io.livekit.server.RoomServiceClient;
import okhttp3.OkHttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LiveKitConfig {

    @Value("${livekit.server-url}")
    private String serverUrl;

    @Value("${livekit.api-key}")
    private String apiKey;

    @Value("${livekit.api-secret}")
    private String apiSecret;

    @Bean
    public RoomServiceClient roomServiceClient() {
        return RoomServiceClient.createClient(serverUrl, apiKey, apiSecret);
    }
}
```

- [ ] **Step 4: LiveKitService 구현**

```java
// LiveKitService.java
package com.hyend.service;

import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import io.livekit.server.RoomServiceClient;
import livekit.LivekitModels;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import retrofit2.Response;
import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class LiveKitService {

    private final RoomServiceClient roomServiceClient;

    @Value("${livekit.api-key}")
    private String apiKey;

    @Value("${livekit.api-secret}")
    private String apiSecret;

    public void createRoom(String roomName) {
        try {
            Response<LivekitModels.Room> response = roomServiceClient
                    .createRoom(roomName)
                    .execute();
            if (!response.isSuccessful()) {
                log.warn("LiveKit 방 생성 실패: {}", response.errorBody());
            }
        } catch (IOException e) {
            log.error("LiveKit 방 생성 중 오류", e);
            throw new RuntimeException("LiveKit 방 생성 실패", e);
        }
    }

    public String generateToken(String roomName, String participantIdentity, String participantName) {
        AccessToken token = new AccessToken(apiKey, apiSecret);
        token.setName(participantName);
        token.setIdentity(participantIdentity);
        token.addGrants(new RoomJoin(true), new RoomName(roomName));
        return token.toJwt();
    }
}
```

- [ ] **Step 5: 테스트 실행 — 통과 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.LiveKitServiceTest"
```

예상: `BUILD SUCCESSFUL`

- [ ] **Step 6: 커밋**

```bash
git add backend/src/main/java/com/hyend/config/LiveKitConfig.java \
        backend/src/main/java/com/hyend/service/LiveKitService.java \
        backend/src/test/java/com/hyend/service/LiveKitServiceTest.java
git commit -m "feat: add LiveKitConfig and LiveKitService for room/token management"
```

---

### Task 6: Meeting DTOs

**Files:**
- Create: `backend/src/main/java/com/hyend/dto/meeting/MeetingRoomRequest.java`
- Create: `backend/src/main/java/com/hyend/dto/meeting/MeetingRoomResponse.java`
- Create: `backend/src/main/java/com/hyend/dto/meeting/MeetingRoomSummary.java`
- Create: `backend/src/main/java/com/hyend/dto/meeting/JoinMeetingResponse.java`

**Interfaces:**
- Produces:
  - `MeetingRoomRequest(title: String, description: String)` — record
  - `MeetingRoomResponse.from(MeetingRoom): MeetingRoomResponse`
  - `MeetingRoomSummary.from(MeetingRoom): MeetingRoomSummary`
  - `JoinMeetingResponse(livekitToken: String, roomName: String)`

- [ ] **Step 1: DTO 구현**

```java
// MeetingRoomRequest.java
package com.hyend.dto.meeting;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MeetingRoomRequest(
        @NotBlank @Size(max = 100) String title,
        String description
) {}
```

```java
// MeetingRoomResponse.java
package com.hyend.dto.meeting;

import com.hyend.entity.MeetingRoom;
import java.time.LocalDateTime;

public record MeetingRoomResponse(
        Long id,
        String title,
        String description,
        Long hostId,
        String hostName,
        String status,
        String livekitRoomName,
        LocalDateTime createdAt,
        LocalDateTime endedAt
) {
    public static MeetingRoomResponse from(MeetingRoom room) {
        return new MeetingRoomResponse(
                room.getId(),
                room.getTitle(),
                room.getDescription(),
                room.getHost().getId(),
                room.getHost().getName(),
                room.getStatus().name(),
                room.getLivekitRoomName(),
                room.getCreatedAt(),
                room.getEndedAt()
        );
    }
}
```

```java
// MeetingRoomSummary.java
package com.hyend.dto.meeting;

import com.hyend.entity.MeetingRoom;
import java.time.LocalDateTime;

public record MeetingRoomSummary(
        Long id,
        String title,
        String status,
        String hostName,
        LocalDateTime createdAt
) {
    public static MeetingRoomSummary from(MeetingRoom room) {
        return new MeetingRoomSummary(
                room.getId(),
                room.getTitle(),
                room.getStatus().name(),
                room.getHost().getName(),
                room.getCreatedAt()
        );
    }
}
```

```java
// JoinMeetingResponse.java
package com.hyend.dto.meeting;

public record JoinMeetingResponse(
        String livekitToken,
        String roomName,
        Long roomId
) {}
```

- [ ] **Step 2: 커밋**

```bash
git add backend/src/main/java/com/hyend/dto/meeting/
git commit -m "feat: add Meeting DTOs (Request, Response, Summary, JoinResponse)"
```

---

### Task 7: MeetingRoomService

**Files:**
- Create: `backend/src/main/java/com/hyend/service/MeetingRoomService.java`
- Create: `backend/src/test/java/com/hyend/service/MeetingRoomServiceTest.java`

**Interfaces:**
- Consumes: `MeetingRoomRepository`, `MeetingParticipantRepository`, `UserRepository`, `LiveKitService`
- Produces:
  - `create(request: MeetingRoomRequest, userId: Long): MeetingRoomResponse`
  - `getList(): List<MeetingRoomSummary>`
  - `getDetail(id: Long): MeetingRoomResponse`
  - `join(id: Long, userId: Long): JoinMeetingResponse`
  - `leave(id: Long, userId: Long): void`
  - `end(id: Long, userId: Long): void`
  - `delete(id: Long, userId: Long): void`

- [ ] **Step 1: 테스트 작성**

```java
// MeetingRoomServiceTest.java
package com.hyend.service;

import com.hyend.dto.meeting.JoinMeetingResponse;
import com.hyend.dto.meeting.MeetingRoomRequest;
import com.hyend.dto.meeting.MeetingRoomResponse;
import com.hyend.entity.MeetingRoom;
import com.hyend.entity.MeetingParticipant;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingParticipantRepository;
import com.hyend.repository.MeetingRoomRepository;
import com.hyend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MeetingRoomServiceTest {

    @Mock MeetingRoomRepository roomRepository;
    @Mock MeetingParticipantRepository participantRepository;
    @Mock UserRepository userRepository;
    @Mock LiveKitService liveKitService;
    @InjectMocks MeetingRoomService meetingRoomService;

    private User host;
    private MeetingRoom room;

    @BeforeEach
    void setUp() {
        host = mock(User.class);
        when(host.getId()).thenReturn(1L);
        when(host.getName()).thenReturn("호스트");

        room = MeetingRoom.of("테스트 회의", "설명", host, "room-uuid");
        ReflectionTestUtils.setField(room, "id", 10L);
    }

    @Test
    void join_returnsLiveKitToken_whenRoomIsWaiting() {
        User participant = mock(User.class);
        when(participant.getId()).thenReturn(2L);
        when(participant.getName()).thenReturn("참가자");
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(userRepository.findById(2L)).thenReturn(Optional.of(participant));
        when(participantRepository.existsByRoomIdAndUserId(10L, 2L)).thenReturn(false);
        when(liveKitService.generateToken(anyString(), anyString(), anyString())).thenReturn("livekit.jwt.token");

        JoinMeetingResponse response = meetingRoomService.join(10L, 2L);

        assertThat(response.livekitToken()).isEqualTo("livekit.jwt.token");
        assertThat(response.roomName()).isEqualTo("room-uuid");
        verify(participantRepository).save(any(MeetingParticipant.class));
    }

    @Test
    void end_throwsException_whenNotHost() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> meetingRoomService.end(10L, 99L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void end_changesStatusToEnded_whenHost() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        meetingRoomService.end(10L, 1L);

        assertThat(room.getStatus()).isEqualTo(MeetingRoom.Status.ENDED);
    }
}
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.MeetingRoomServiceTest" 2>&1 | tail -5
```

- [ ] **Step 3: MeetingRoomService 구현**

```java
// MeetingRoomService.java
package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.*;
import com.hyend.entity.*;
import com.hyend.exception.BusinessException;
import com.hyend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MeetingRoomService {

    private final MeetingRoomRepository roomRepository;
    private final MeetingParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final LiveKitService liveKitService;

    @Transactional
    public MeetingRoomResponse create(MeetingRoomRequest request, Long userId) {
        User host = findUser(userId);
        String livekitRoomName = UUID.randomUUID().toString();
        MeetingRoom room = MeetingRoom.of(request.title(), request.description(), host, livekitRoomName);
        liveKitService.createRoom(livekitRoomName);
        return MeetingRoomResponse.from(roomRepository.save(room));
    }

    public List<MeetingRoomSummary> getList() {
        return roomRepository.findAll().stream()
                .filter(r -> r.getStatus() != MeetingRoom.Status.ENDED)
                .map(MeetingRoomSummary::from)
                .toList();
    }

    public MeetingRoomResponse getDetail(Long id) {
        return MeetingRoomResponse.from(findRoom(id));
    }

    @Transactional
    public JoinMeetingResponse join(Long roomId, Long userId) {
        MeetingRoom room = findRoom(roomId);
        if (room.isEnded()) throw new BusinessException(ErrorCode.MEETING_ALREADY_ENDED);

        User user = findUser(userId);
        if (!participantRepository.existsByRoomIdAndUserId(roomId, userId)) {
            participantRepository.save(MeetingParticipant.of(room, user));
        }
        if (room.getStatus() == MeetingRoom.Status.WAITING) room.activate();

        String token = liveKitService.generateToken(room.getLivekitRoomName(), userId.toString(), user.getName());
        return new JoinMeetingResponse(token, room.getLivekitRoomName(), room.getId());
    }

    @Transactional
    public void leave(Long roomId, Long userId) {
        participantRepository.findByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)
                .ifPresent(MeetingParticipant::leave);
    }

    @Transactional
    public void end(Long roomId, Long userId) {
        MeetingRoom room = findRoom(roomId);
        if (!room.isHost(userId)) throw new BusinessException(ErrorCode.NOT_MEETING_HOST);
        if (room.isEnded()) throw new BusinessException(ErrorCode.MEETING_ALREADY_ENDED);
        room.end();
    }

    @Transactional
    public void delete(Long roomId, Long userId) {
        MeetingRoom room = findRoom(roomId);
        if (!room.isHost(userId)) throw new BusinessException(ErrorCode.NOT_MEETING_HOST);
        roomRepository.delete(room);
    }

    private MeetingRoom findRoom(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.MeetingRoomServiceTest"
```

예상: `BUILD SUCCESSFUL`

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/com/hyend/service/MeetingRoomService.java \
        backend/src/test/java/com/hyend/service/MeetingRoomServiceTest.java
git commit -m "feat: add MeetingRoomService with CRUD and LiveKit join flow"
```

---

### Task 8: MeetingController

**Files:**
- Create: `backend/src/main/java/com/hyend/controller/MeetingController.java`
- Create: `backend/src/test/java/com/hyend/controller/MeetingControllerTest.java`

**Interfaces:**
- Consumes: `MeetingRoomService`
- Produces:
  - `POST /api/meetings` → `ApiResponse<MeetingRoomResponse>`
  - `GET /api/meetings` → `ApiResponse<List<MeetingRoomSummary>>`
  - `GET /api/meetings/{id}` → `ApiResponse<MeetingRoomResponse>`
  - `POST /api/meetings/{id}/join` → `ApiResponse<JoinMeetingResponse>`
  - `POST /api/meetings/{id}/leave` → `ApiResponse<Void>`
  - `POST /api/meetings/{id}/end` → `ApiResponse<Void>`
  - `DELETE /api/meetings/{id}` → `ApiResponse<Void>`

- [ ] **Step 1: 테스트 작성**

```java
// MeetingControllerTest.java
package com.hyend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hyend.dto.meeting.*;
import com.hyend.service.MeetingRoomService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MeetingController.class)
class MeetingControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean MeetingRoomService meetingRoomService;

    @Test
    @WithMockUser
    void createMeeting_returns201() throws Exception {
        MeetingRoomRequest request = new MeetingRoomRequest("테스트 회의", "설명");
        MeetingRoomResponse response = new MeetingRoomResponse(
                1L, "테스트 회의", "설명", 1L, "홍길동",
                "WAITING", "room-uuid", LocalDateTime.now(), null);
        when(meetingRoomService.create(any(), anyLong())).thenReturn(response);

        mockMvc.perform(post("/api/meetings")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("테스트 회의"));
    }

    @Test
    @WithMockUser
    void getMeetings_returnsListWithSuccess() throws Exception {
        when(meetingRoomService.getList()).thenReturn(List.of());

        mockMvc.perform(get("/api/meetings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.controller.MeetingControllerTest" 2>&1 | tail -5
```

- [ ] **Step 3: MeetingController 구현**

```java
// MeetingController.java
package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.meeting.*;
import com.hyend.security.UserPrincipal;
import com.hyend.service.MeetingRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingRoomService meetingRoomService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MeetingRoomResponse> create(
            @Valid @RequestBody MeetingRoomRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(meetingRoomService.create(request, principal.getId()));
    }

    @GetMapping
    public ApiResponse<List<MeetingRoomSummary>> getList() {
        return ApiResponse.success(meetingRoomService.getList());
    }

    @GetMapping("/{id}")
    public ApiResponse<MeetingRoomResponse> getDetail(@PathVariable Long id) {
        return ApiResponse.success(meetingRoomService.getDetail(id));
    }

    @PostMapping("/{id}/join")
    public ApiResponse<JoinMeetingResponse> join(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(meetingRoomService.join(id, principal.getId()));
    }

    @PostMapping("/{id}/leave")
    public ApiResponse<Void> leave(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        meetingRoomService.leave(id, principal.getId());
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/end")
    public ApiResponse<Void> end(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        meetingRoomService.end(id, principal.getId());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        meetingRoomService.delete(id, principal.getId());
        return ApiResponse.success(null);
    }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.controller.MeetingControllerTest"
```

- [ ] **Step 5: 전체 테스트 확인**

```bash
cd backend && ./gradlew test 2>&1 | tail -10
```

예상: `BUILD SUCCESSFUL`

- [ ] **Step 6: 커밋**

```bash
git add backend/src/main/java/com/hyend/controller/MeetingController.java \
        backend/src/test/java/com/hyend/controller/MeetingControllerTest.java
git commit -m "feat: add MeetingController REST API endpoints"
```

---

**Plan A 완료 기준:** `./gradlew test` 전체 통과 + `POST /api/meetings` 호출 시 LiveKit 토큰 반환 확인
