# Plan C: 채팅 + 초대 링크 + FCM 알림 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 회의방 내 실시간 채팅(텍스트+파일), 초대 링크(Redis TTL), Firebase FCM 푸시 알림을 구현한다.

**Architecture:** WebSocket은 STOMP over SockJS로 구성한다. 채팅은 STOMP publish/subscribe로, 파일 전송은 기존 S3/로컬 파일 스토리지를 재사용한다. 초대 토큰은 Redis에 TTL로 저장하고, FCM은 Firebase Admin SDK로 발송한다.

**Tech Stack:** Spring Boot 4.0.5, Java 21, STOMP + SockJS, Firebase Admin SDK 9.x, Redis, JUnit 5 + Mockito

**선행 조건:** Plan A 완료 (DB 마이그레이션 V16, V17 포함)

## Global Constraints

- WebSocket 엔드포인트: `/ws` (SockJS fallback 포함)
- STOMP topic: `/topic/meetings/{id}/chat`, `/topic/meetings/{id}/transcript`
- STOMP app prefix: `/app`
- 파일 업로드: 기존 `FileStorageService` 재사용, 10MB 제한, 허용 확장자 기존 목록 그대로
- FCM 토큰: DB의 `user_fcm_tokens` 테이블 + Redis 캐시 없이 직접 DB 조회

---

### Task 1: WebSocketConfig (STOMP + SockJS)

**Files:**
- Create: `backend/src/main/java/com/hyend/config/WebSocketConfig.java`
- Modify: `backend/src/main/java/com/hyend/config/SecurityConfig.java` — WebSocket 경로 허용

**Interfaces:**
- Produces: STOMP 브로커 설정, `/ws` 엔드포인트, `/topic` 구독, `/app` 발행

- [ ] **Step 1: WebSocketConfig 구현**

```java
// WebSocketConfig.java
package com.hyend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
```

- [ ] **Step 2: SecurityConfig에 WebSocket 경로 허용 추가**

`SecurityConfig.java`에서 `requestMatchers` 설정에 추가:

```java
.requestMatchers("/ws/**").permitAll()
```

- [ ] **Step 3: 앱 기동으로 WebSocket 엔드포인트 확인**

```bash
cd backend && ./gradlew bootRun &
sleep 15
curl -s http://localhost:8080/ws/info | python3 -m json.tool | head -5
kill %1
```

예상 출력: `"entropy"` 필드 포함 SockJS 정보 JSON

- [ ] **Step 4: 커밋**

```bash
git add backend/src/main/java/com/hyend/config/WebSocketConfig.java \
        backend/src/main/java/com/hyend/config/SecurityConfig.java
git commit -m "feat: add WebSocketConfig with STOMP over SockJS"
```

---

### Task 2: MeetingChatMessage 엔티티 + Repository

**Files:**
- Create: `backend/src/main/java/com/hyend/entity/MeetingChatMessage.java`
- Create: `backend/src/main/java/com/hyend/repository/MeetingChatMessageRepository.java`

**Interfaces:**
- Produces:
  - `MeetingChatMessage.ofText(room, user, content): MeetingChatMessage`
  - `MeetingChatMessage.ofFile(room, user, fileUrl, fileName, fileSize): MeetingChatMessage`
  - `MeetingChatMessageRepository.findByRoomIdOrderByCreatedAtAsc(roomId, pageable): Page<MeetingChatMessage>`

- [ ] **Step 1: MeetingChatMessage 엔티티 구현**

```java
// MeetingChatMessage.java
package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_chat_messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MeetingChatMessage {

    public enum Type { TEXT, FILE }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private MeetingRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Type type;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String fileUrl;

    @Column(length = 255)
    private String fileName;

    private Long fileSize;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public static MeetingChatMessage ofText(MeetingRoom room, User user, String content) {
        MeetingChatMessage m = new MeetingChatMessage();
        m.room = room;
        m.user = user;
        m.type = Type.TEXT;
        m.content = content;
        m.createdAt = LocalDateTime.now();
        return m;
    }

    public static MeetingChatMessage ofFile(MeetingRoom room, User user,
                                             String fileUrl, String fileName, long fileSize) {
        MeetingChatMessage m = new MeetingChatMessage();
        m.room = room;
        m.user = user;
        m.type = Type.FILE;
        m.fileUrl = fileUrl;
        m.fileName = fileName;
        m.fileSize = fileSize;
        m.createdAt = LocalDateTime.now();
        return m;
    }
}
```

- [ ] **Step 2: Repository 구현**

```java
// MeetingChatMessageRepository.java
package com.hyend.repository;

import com.hyend.entity.MeetingChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MeetingChatMessageRepository extends JpaRepository<MeetingChatMessage, Long> {
    Page<MeetingChatMessage> findByRoomIdOrderByCreatedAtAsc(Long roomId, Pageable pageable);
}
```

- [ ] **Step 3: 커밋**

```bash
git add backend/src/main/java/com/hyend/entity/MeetingChatMessage.java \
        backend/src/main/java/com/hyend/repository/MeetingChatMessageRepository.java
git commit -m "feat: add MeetingChatMessage entity and repository"
```

---

### Task 3: MeetingChatService + WebSocket 컨트롤러

**Files:**
- Create: `backend/src/main/java/com/hyend/service/MeetingChatService.java`
- Create: `backend/src/main/java/com/hyend/controller/MeetingChatController.java`
- Create: `backend/src/main/java/com/hyend/dto/meeting/ChatMessageRequest.java`
- Create: `backend/src/main/java/com/hyend/dto/meeting/ChatMessageResponse.java`
- Create: `backend/src/test/java/com/hyend/service/MeetingChatServiceTest.java`

**Interfaces:**
- Produces:
  - STOMP `@MessageMapping("/meetings/{id}/chat")` — 텍스트 메시지 수신 및 broadcast
  - `GET /api/meetings/{id}/chat` — 이전 메시지 페이지 조회
  - `POST /api/meetings/{id}/chat/files` — 파일 업로드 후 broadcast

- [ ] **Step 1: DTO 작성**

```java
// ChatMessageRequest.java
package com.hyend.dto.meeting;

public record ChatMessageRequest(String content) {}
```

```java
// ChatMessageResponse.java
package com.hyend.dto.meeting;

import com.hyend.entity.MeetingChatMessage;
import java.time.LocalDateTime;

public record ChatMessageResponse(
        Long id,
        Long roomId,
        Long userId,
        String userName,
        String type,
        String content,
        String fileUrl,
        String fileName,
        Long fileSize,
        LocalDateTime createdAt
) {
    public static ChatMessageResponse from(MeetingChatMessage m) {
        return new ChatMessageResponse(
                m.getId(),
                m.getRoom().getId(),
                m.getUser().getId(),
                m.getUser().getName(),
                m.getType().name(),
                m.getContent(),
                m.getFileUrl(),
                m.getFileName(),
                m.getFileSize(),
                m.getCreatedAt()
        );
    }
}
```

- [ ] **Step 2: 테스트 작성**

```java
// MeetingChatServiceTest.java
package com.hyend.service;

import com.hyend.dto.meeting.ChatMessageResponse;
import com.hyend.entity.*;
import com.hyend.repository.*;
import com.hyend.service.FileStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MeetingChatServiceTest {

    @Mock MeetingChatMessageRepository chatRepository;
    @Mock MeetingRoomRepository roomRepository;
    @Mock UserRepository userRepository;
    @Mock SimpMessagingTemplate messagingTemplate;
    @InjectMocks MeetingChatService chatService;

    @Test
    void sendTextMessage_savesAndBroadcasts() {
        MeetingRoom room = mock(MeetingRoom.class);
        when(room.getId()).thenReturn(1L);
        User user = mock(User.class);
        when(user.getId()).thenReturn(2L);
        when(user.getName()).thenReturn("홍길동");

        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));

        MeetingChatMessage saved = MeetingChatMessage.ofText(room, user, "안녕하세요");
        when(chatRepository.save(any())).thenReturn(saved);

        ChatMessageResponse response = chatService.sendTextMessage(1L, 2L, "안녕하세요");

        assertThat(response.userName()).isEqualTo("홍길동");
        assertThat(response.type()).isEqualTo("TEXT");
        verify(messagingTemplate).convertAndSend(eq("/topic/meetings/1/chat"), any());
    }
}
```

- [ ] **Step 3: 테스트 실행 — 실패 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.MeetingChatServiceTest" 2>&1 | tail -5
```

- [ ] **Step 4: MeetingChatService 구현**

```java
// MeetingChatService.java
package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.ChatMessageResponse;
import com.hyend.entity.*;
import com.hyend.exception.BusinessException;
import com.hyend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MeetingChatService {

    private final MeetingChatMessageRepository chatRepository;
    private final MeetingRoomRepository roomRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessageResponse sendTextMessage(Long roomId, Long userId, String content) {
        MeetingRoom room = findRoom(roomId);
        User user = findUser(userId);
        MeetingChatMessage message = chatRepository.save(MeetingChatMessage.ofText(room, user, content));
        ChatMessageResponse response = ChatMessageResponse.from(message);
        messagingTemplate.convertAndSend("/topic/meetings/%d/chat".formatted(roomId), response);
        return response;
    }

    @Transactional
    public ChatMessageResponse sendFileMessage(Long roomId, Long userId, MultipartFile file) throws IOException {
        MeetingRoom room = findRoom(roomId);
        User user = findUser(userId);
        String fileUrl = fileStorageService.store(file);
        MeetingChatMessage message = chatRepository.save(
                MeetingChatMessage.ofFile(room, user, fileUrl, file.getOriginalFilename(), file.getSize()));
        ChatMessageResponse response = ChatMessageResponse.from(message);
        messagingTemplate.convertAndSend("/topic/meetings/%d/chat".formatted(roomId), response);
        return response;
    }

    public Page<ChatMessageResponse> getHistory(Long roomId, Pageable pageable) {
        return chatRepository.findByRoomIdOrderByCreatedAtAsc(roomId, pageable)
                .map(ChatMessageResponse::from);
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

- [ ] **Step 5: MeetingChatController 구현**

```java
// MeetingChatController.java
package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.meeting.*;
import com.hyend.security.UserPrincipal;
import com.hyend.service.MeetingChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;

@RestController
@RequiredArgsConstructor
public class MeetingChatController {

    private final MeetingChatService chatService;

    // STOMP: 텍스트 메시지 수신
    @MessageMapping("/meetings/{roomId}/chat")
    public void handleChat(@DestinationVariable Long roomId,
                           ChatMessageRequest request,
                           Principal principal) {
        Long userId = Long.parseLong(principal.getName());
        chatService.sendTextMessage(roomId, userId, request.content());
    }

    // REST: 파일 메시지 업로드
    @PostMapping("/api/meetings/{id}/chat/files")
    public ApiResponse<ChatMessageResponse> uploadChatFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) throws IOException {
        return ApiResponse.success(chatService.sendFileMessage(id, principal.getId(), file));
    }

    // REST: 채팅 히스토리 조회
    @GetMapping("/api/meetings/{id}/chat")
    public ApiResponse<Page<ChatMessageResponse>> getHistory(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.success(chatService.getHistory(id, PageRequest.of(page, size)));
    }
}
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.MeetingChatServiceTest"
```

- [ ] **Step 7: 커밋**

```bash
git add backend/src/main/java/com/hyend/service/MeetingChatService.java \
        backend/src/main/java/com/hyend/controller/MeetingChatController.java \
        backend/src/main/java/com/hyend/dto/meeting/ChatMessageRequest.java \
        backend/src/main/java/com/hyend/dto/meeting/ChatMessageResponse.java \
        backend/src/test/java/com/hyend/service/MeetingChatServiceTest.java
git commit -m "feat: add meeting chat via STOMP WebSocket and file upload REST API"
```

---

### Task 4: InviteService + InviteController

**Files:**
- Create: `backend/src/main/java/com/hyend/service/InviteService.java`
- Create: `backend/src/main/java/com/hyend/controller/InviteController.java`
- Create: `backend/src/main/java/com/hyend/dto/meeting/InviteRequest.java`
- Create: `backend/src/main/java/com/hyend/dto/meeting/InviteResponse.java`
- Create: `backend/src/test/java/com/hyend/service/InviteServiceTest.java`

**Interfaces:**
- Produces:
  - `POST /api/meetings/{id}/invite` → `InviteResponse(inviteUrl, expiresAt)`
  - `GET /api/invite/{token}` → `ApiResponse<Long>` (roomId)
  - Redis 키: `meeting:invite:{token}` → roomId, TTL = expiresInHours

- [ ] **Step 1: DTO 작성**

```java
// InviteRequest.java
package com.hyend.dto.meeting;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record InviteRequest(
        @Min(1) @Max(168) int expiresInHours
) {}
```

```java
// InviteResponse.java
package com.hyend.dto.meeting;

import java.time.LocalDateTime;

public record InviteResponse(
        String inviteUrl,
        String token,
        LocalDateTime expiresAt
) {}
```

- [ ] **Step 2: 테스트 작성**

```java
// InviteServiceTest.java
package com.hyend.service;

import com.hyend.dto.meeting.InviteResponse;
import com.hyend.entity.MeetingRoom;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingRoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InviteServiceTest {

    @Mock StringRedisTemplate redisTemplate;
    @Mock ValueOperations<String, String> valueOps;
    @Mock MeetingRoomRepository roomRepository;
    @InjectMocks InviteService inviteService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        ReflectionTestUtils.setField(inviteService, "baseUrl", "https://hyend.ac.kr");
    }

    @Test
    void createInvite_returnsUrlWithToken() {
        MeetingRoom room = mock(MeetingRoom.class);
        when(room.getId()).thenReturn(1L);
        when(room.isHost(42L)).thenReturn(true);
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));

        InviteResponse response = inviteService.createInvite(1L, 42L, 24);

        assertThat(response.inviteUrl()).startsWith("https://hyend.ac.kr/invite/");
        assertThat(response.token()).isNotBlank();
        verify(valueOps).set(contains("meeting:invite:"), eq("1"), any(), any());
    }

    @Test
    void resolveInvite_throwsException_whenTokenNotFound() {
        when(valueOps.get("meeting:invite:invalid-token")).thenReturn(null);

        assertThatThrownBy(() -> inviteService.resolveInvite("invalid-token"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void resolveInvite_returnsRoomId_whenTokenValid() {
        when(valueOps.get("meeting:invite:valid-token")).thenReturn("5");

        Long roomId = inviteService.resolveInvite("valid-token");

        assertThat(roomId).isEqualTo(5L);
    }
}
```

- [ ] **Step 3: 테스트 실행 — 실패 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.InviteServiceTest" 2>&1 | tail -5
```

- [ ] **Step 4: InviteService 구현**

```java
// InviteService.java
package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.InviteResponse;
import com.hyend.entity.MeetingRoom;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class InviteService {

    private final StringRedisTemplate redisTemplate;
    private final MeetingRoomRepository roomRepository;

    @Value("${app.base-url:https://hyend.ac.kr}")
    private String baseUrl;

    public InviteResponse createInvite(Long roomId, Long userId, int expiresInHours) {
        MeetingRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
        if (!room.isHost(userId)) throw new BusinessException(ErrorCode.NOT_MEETING_HOST);

        String token = UUID.randomUUID().toString().replace("-", "");
        String key = "meeting:invite:" + token;
        redisTemplate.opsForValue().set(key, roomId.toString(), expiresInHours, TimeUnit.HOURS);

        return new InviteResponse(
                "%s/invite/%s".formatted(baseUrl, token),
                token,
                LocalDateTime.now().plusHours(expiresInHours)
        );
    }

    public Long resolveInvite(String token) {
        String val = redisTemplate.opsForValue().get("meeting:invite:" + token);
        if (val == null) throw new BusinessException(ErrorCode.INVITE_NOT_FOUND);
        return Long.parseLong(val);
    }
}
```

- [ ] **Step 5: InviteController 구현**

```java
// InviteController.java
package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.meeting.InviteRequest;
import com.hyend.dto.meeting.InviteResponse;
import com.hyend.security.UserPrincipal;
import com.hyend.service.InviteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class InviteController {

    private final InviteService inviteService;

    @PostMapping("/api/meetings/{id}/invite")
    public ApiResponse<InviteResponse> createInvite(
            @PathVariable Long id,
            @Valid @RequestBody InviteRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(
                inviteService.createInvite(id, principal.getId(), request.expiresInHours()));
    }

    @GetMapping("/api/invite/{token}")
    public ApiResponse<Long> resolveInvite(@PathVariable String token) {
        return ApiResponse.success(inviteService.resolveInvite(token));
    }
}
```

- [ ] **Step 6: application.yml에 base-url 추가**

`application.yml`에 추가:

```yaml
app:
  base-url: ${APP_BASE_URL:https://hyend.ac.kr}
```

- [ ] **Step 7: 테스트 통과 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.InviteServiceTest"
```

- [ ] **Step 8: 커밋**

```bash
git add backend/src/main/java/com/hyend/service/InviteService.java \
        backend/src/main/java/com/hyend/controller/InviteController.java \
        backend/src/main/java/com/hyend/dto/meeting/InviteRequest.java \
        backend/src/main/java/com/hyend/dto/meeting/InviteResponse.java \
        backend/src/main/resources/application.yml \
        backend/src/test/java/com/hyend/service/InviteServiceTest.java
git commit -m "feat: add invite link system with Redis TTL tokens"
```

---

### Task 5: FirebaseConfig + NotificationService + FCM Controller

**Files:**
- Create: `backend/src/main/java/com/hyend/config/FirebaseConfig.java`
- Create: `backend/src/main/java/com/hyend/entity/UserFcmToken.java`
- Create: `backend/src/main/java/com/hyend/repository/UserFcmTokenRepository.java`
- Create: `backend/src/main/java/com/hyend/service/NotificationService.java`
- Create: `backend/src/main/java/com/hyend/controller/NotificationController.java`
- Create: `backend/src/test/java/com/hyend/service/NotificationServiceTest.java`

**Interfaces:**
- Produces:
  - `NotificationService.sendToUser(userId, title, body, link): void`
  - `NotificationService.sendToUsers(userIds, title, body, link): void`
  - `POST /api/notifications/subscribe` — FCM 토큰 등록
  - `DELETE /api/notifications/subscribe` — FCM 토큰 제거

- [ ] **Step 1: FirebaseConfig 구현**

```java
// FirebaseConfig.java
package com.hyend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import java.io.FileInputStream;
import java.io.IOException;

@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    @PostConstruct
    public void init() {
        if (!StringUtils.hasText(credentialsPath)) {
            log.warn("Firebase 인증 파일 경로가 설정되지 않아 FCM 알림이 비활성화됩니다.");
            return;
        }
        if (!FirebaseApp.getApps().isEmpty()) return;
        try {
            FileInputStream serviceAccount = new FileInputStream(credentialsPath);
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();
            FirebaseApp.initializeApp(options);
            log.info("Firebase 초기화 완료");
        } catch (IOException e) {
            log.error("Firebase 초기화 실패: {}", e.getMessage());
        }
    }
}
```

- [ ] **Step 2: UserFcmToken 엔티티 구현**

```java
// UserFcmToken.java
package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_fcm_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserFcmToken {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, columnDefinition = "TEXT")
    private String token;

    @Column(length = 255)
    private String userAgent;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime lastUsedAt = LocalDateTime.now();

    public static UserFcmToken of(User user, String token, String userAgent) {
        UserFcmToken t = new UserFcmToken();
        t.user = user;
        t.token = token;
        t.userAgent = userAgent;
        t.createdAt = LocalDateTime.now();
        t.lastUsedAt = LocalDateTime.now();
        return t;
    }

    public void refreshLastUsed() { this.lastUsedAt = LocalDateTime.now(); }
}
```

- [ ] **Step 3: UserFcmTokenRepository 구현**

```java
// UserFcmTokenRepository.java
package com.hyend.repository;

import com.hyend.entity.UserFcmToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserFcmTokenRepository extends JpaRepository<UserFcmToken, Long> {
    Optional<UserFcmToken> findByToken(String token);
    List<UserFcmToken> findByUserId(Long userId);

    @Query("SELECT t FROM UserFcmToken t WHERE t.user.id IN :userIds")
    List<UserFcmToken> findByUserIds(List<Long> userIds);

    void deleteByToken(String token);
}
```

- [ ] **Step 4: 테스트 작성**

```java
// NotificationServiceTest.java
package com.hyend.service;

import com.hyend.entity.User;
import com.hyend.entity.UserFcmToken;
import com.hyend.repository.UserFcmTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock UserFcmTokenRepository fcmTokenRepository;
    @InjectMocks NotificationService notificationService;

    @Test
    void sendToUser_skipsWhenNoTokens() {
        when(fcmTokenRepository.findByUserId(1L)).thenReturn(List.of());

        notificationService.sendToUser(1L, "제목", "내용", "/meetings/1");

        // Firebase 실제 호출 없이 조용히 종료
        verify(fcmTokenRepository).findByUserId(1L);
    }

    @Test
    void registerToken_savesNewToken() {
        User user = mock(User.class);
        when(fcmTokenRepository.findByToken("fcm-token-abc")).thenReturn(java.util.Optional.empty());

        notificationService.registerToken(user, "fcm-token-abc", "Chrome/126");

        verify(fcmTokenRepository).save(any(UserFcmToken.class));
    }
}
```

- [ ] **Step 5: 테스트 실행 — 실패 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.NotificationServiceTest" 2>&1 | tail -5
```

- [ ] **Step 6: NotificationService 구현**

```java
// NotificationService.java
package com.hyend.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.*;
import com.hyend.entity.User;
import com.hyend.entity.UserFcmToken;
import com.hyend.repository.UserFcmTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final UserFcmTokenRepository fcmTokenRepository;

    public void sendToUser(Long userId, String title, String body, String link) {
        List<UserFcmToken> tokens = fcmTokenRepository.findByUserId(userId);
        if (tokens.isEmpty()) return;
        sendToTokenStrings(tokens.stream().map(UserFcmToken::getToken).toList(), title, body, link);
    }

    public void sendToUsers(List<Long> userIds, String title, String body, String link) {
        List<String> tokens = fcmTokenRepository.findByUserIds(userIds)
                .stream().map(UserFcmToken::getToken).toList();
        if (tokens.isEmpty()) return;
        sendToTokenStrings(tokens, title, body, link);
    }

    @Transactional
    public void registerToken(User user, String token, String userAgent) {
        fcmTokenRepository.findByToken(token)
                .ifPresentOrElse(
                        UserFcmToken::refreshLastUsed,
                        () -> fcmTokenRepository.save(UserFcmToken.of(user, token, userAgent)));
    }

    @Transactional
    public void removeToken(String token) {
        fcmTokenRepository.deleteByToken(token);
    }

    private void sendToTokenStrings(List<String> tokens, String title, String body, String link) {
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("Firebase 미설정 — FCM 알림 스킵");
            return;
        }
        MulticastMessage message = MulticastMessage.builder()
                .setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                .putData("link", link)
                .addAllTokens(tokens)
                .build();
        try {
            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
            log.info("FCM 발송: 성공 {}/{}", response.getSuccessCount(), tokens.size());
        } catch (FirebaseMessagingException e) {
            log.error("FCM 발송 실패", e);
        }
    }
}
```

- [ ] **Step 7: NotificationController 구현**

```java
// NotificationController.java
package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.entity.User;
import com.hyend.repository.UserRepository;
import com.hyend.security.UserPrincipal;
import com.hyend.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @PostMapping("/subscribe")
    public ApiResponse<Void> subscribe(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        notificationService.registerToken(user, body.get("token"), request.getHeader("User-Agent"));
        return ApiResponse.success(null);
    }

    @DeleteMapping("/subscribe")
    public ApiResponse<Void> unsubscribe(@RequestBody Map<String, String> body) {
        notificationService.removeToken(body.get("token"));
        return ApiResponse.success(null);
    }
}
```

- [ ] **Step 8: AnnouncementService에 FCM 알림 연동**

`AnnouncementService.java`의 create 메서드 끝에 추가:

```java
// 필드 추가
private final NotificationService notificationService;
private final UserRepository userRepository;

// create 메서드 내 저장 후 추가
List<Long> allUserIds = userRepository.findAll().stream().map(User::getId).toList();
notificationService.sendToUsers(allUserIds, "새 공지사항", announcement.getTitle(), "/board/notice/" + announcement.getId());
```

- [ ] **Step 9: 테스트 통과 확인**

```bash
cd backend && ./gradlew test --tests "com.hyend.service.NotificationServiceTest"
```

- [ ] **Step 10: 전체 테스트**

```bash
cd backend && ./gradlew test 2>&1 | tail -10
```

- [ ] **Step 11: 커밋**

```bash
git add backend/src/main/java/com/hyend/config/FirebaseConfig.java \
        backend/src/main/java/com/hyend/entity/UserFcmToken.java \
        backend/src/main/java/com/hyend/repository/UserFcmTokenRepository.java \
        backend/src/main/java/com/hyend/service/NotificationService.java \
        backend/src/main/java/com/hyend/controller/NotificationController.java \
        backend/src/main/java/com/hyend/service/AnnouncementService.java \
        backend/src/test/java/com/hyend/service/NotificationServiceTest.java
git commit -m "feat: add Firebase FCM push notification service and token management"
```

---

**Plan C 완료 기준:** `./gradlew test` 전체 통과 + WebSocket `/ws` 연결 확인 + STOMP 채팅 메시지 broadcast 동작 + 초대 토큰 생성/검증 확인
