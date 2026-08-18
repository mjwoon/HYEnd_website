# HYEnd 백엔드 고도화 설계 문서

> 작성일: 2026-06-26  
> 작성자: mjwoon  
> 대상 브랜치: dev

---

## 목차

1. [전체 아키텍처](#1-전체-아키텍처)
2. [음성·영상 회의방](#2-음성영상-회의방)
3. [회의방 채팅](#3-회의방-채팅)
4. [초대 링크 공유](#4-초대-링크-공유)
5. [AI 토큰 제한](#5-ai-토큰-제한)
6. [웹 푸시 알림](#6-웹-푸시-알림-pwa--firebase)
7. [DB 마이그레이션 목록](#7-db-마이그레이션-목록)
8. [구현 계획](#8-구현-계획)

---

## 1. 전체 아키텍처

```
브라우저 (React + LiveKit Browser SDK)
  ├── LiveKit SDK ──────────────→ LiveKit Cloud (SFU, 50명 미디어)
  ├── AudioWorklet (VAD + 청크) → Spring Boot /api/meetings/{id}/transcript
  ├── WebSocket ←─────────────── Spring Boot (transcript broadcast)
  └── WebSocket ←─────────────── Spring Boot (채팅 메시지 broadcast)

Spring Boot (기존 서버에 기능 추가)
  ├── 회의방 CRUD + LiveKit 토큰 발급 (LiveKit Java SDK)
  ├── 오디오 청크 수신 → OpenAI Whisper API (@Async)
  ├── 회의 종료 → OpenAI GPT-4o-mini (요약 생성)
  ├── Redis: AI 쿼터 카운터, 초대 토큰 저장
  ├── WebSocket: STOMP over SockJS (transcript + 채팅 통합)
  └── Firebase Admin SDK: FCM 푸시 발송

외부 서비스
  ├── LiveKit Cloud (SFU, 무료 플랜으로 시작)
  ├── OpenAI API (Whisper + GPT-4o-mini)
  └── Firebase FCM (푸시 알림)
```

---

## 2. 음성·영상 회의방

### 2-1. DB 스키마

```sql
-- 회의방
CREATE TABLE meeting_rooms (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(100) NOT NULL,
    description     TEXT,
    host_user_id    BIGINT NOT NULL REFERENCES users(id),
    livekit_room_name VARCHAR(64) NOT NULL UNIQUE,  -- UUID 기반
    status          VARCHAR(16) NOT NULL DEFAULT 'WAITING', -- WAITING|ACTIVE|ENDED
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMP
);

-- 참가자 이력
CREATE TABLE meeting_participants (
    id          BIGSERIAL PRIMARY KEY,
    room_id     BIGINT NOT NULL REFERENCES meeting_rooms(id),
    user_id     BIGINT NOT NULL REFERENCES users(id),
    joined_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    left_at     TIMESTAMP
);

-- 실시간 전사 청크
CREATE TABLE meeting_transcripts (
    id              BIGSERIAL PRIMARY KEY,
    room_id         BIGINT NOT NULL REFERENCES meeting_rooms(id),
    speaker_user_id BIGINT REFERENCES users(id),
    text            TEXT NOT NULL,
    chunk_index     INT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- LLM 생성 회의록
CREATE TABLE meeting_minutes (
    id           BIGSERIAL PRIMARY KEY,
    room_id      BIGINT NOT NULL UNIQUE REFERENCES meeting_rooms(id),
    content      TEXT NOT NULL,  -- 마크다운
    is_edited    BOOLEAN NOT NULL DEFAULT FALSE,
    generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 2-2. 백엔드 API

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| POST | `/api/meetings` | 회의방 생성 | 로그인 |
| GET | `/api/meetings` | 회의방 목록 | 로그인 |
| GET | `/api/meetings/{id}` | 회의방 상세 | 로그인 |
| POST | `/api/meetings/{id}/join` | 참가 + LiveKit 토큰 반환 | 로그인 |
| POST | `/api/meetings/{id}/leave` | 퇴장 | 로그인 |
| POST | `/api/meetings/{id}/end` | 회의 종료 + 요약 시작 | host |
| DELETE | `/api/meetings/{id}` | 회의방 삭제 | host |
| POST | `/api/meetings/{id}/transcript` | 오디오 청크 전송 (multipart) | 참가자 |
| GET | `/api/meetings/{id}/minutes` | 회의록 조회 | 참가자 |
| PUT | `/api/meetings/{id}/minutes` | 회의록 수동 편집 | 참가자 |

**WebSocket (STOMP)**

```
/ws  — 엔드포인트
구독: /topic/meetings/{id}/transcript  — 실시간 전사
구독: /topic/meetings/{id}/chat        — 채팅 메시지
발행: /app/meetings/{id}/chat          — 채팅 메시지 전송
```

### 2-3. 오디오 스트리밍 흐름

```
클라이언트 (AudioWorklet)
  1. AnalyserNode로 RMS 측정 → VAD
     - 무음 임계값: -50dBFS
     - 무음 지속 1.5초 → 청크 확정
     - 최대 청크 길이: 30초 (하드캡)
  2. MediaRecorder (webm/opus 인코딩)
  3. POST /api/meetings/{id}/transcript
     Content-Type: multipart/form-data
     - audio: Blob
     - chunkIndex: number
     - durationSeconds: number

서버 (@Async 비동기 처리)
  4. Redis AI 쿼터 체크 (초과 시 429 반환)
  5. 오디오 바이트 → OpenAI Whisper API
  6. 결과 텍스트 → meeting_transcripts 저장
  7. /topic/meetings/{id}/transcript 로 STOMP broadcast
  8. Redis 누적 시간 업데이트

회의 종료 (POST /api/meetings/{id}/end)
  9. meeting_transcripts 전체 조합
  10. GPT-4o-mini 호출 (아래 프롬프트)
  11. meeting_minutes 저장
  12. FCM 알림: "회의록이 생성됐습니다"
```

### 2-4. LLM 프롬프트

```
System:
  당신은 한국어 회의록 작성 전문가입니다.
  아래 전사 텍스트를 바탕으로 다음 구조의 마크다운 회의록을 작성하세요.

  ## 회의 개요
  ## 주요 논의사항
  ## 결정사항
  ## 액션 아이템

  - 발화자 정보가 있으면 이름을 포함하세요.
  - 반복·잡음 발화는 생략하세요.
  - 모든 결정사항과 할일은 빠짐없이 포함하세요.

User:
  [meeting_transcripts를 chunk_index 순 정렬, 발화자명 포함 텍스트]
```

회의록은 프론트에서 `react-markdown` + `remark-gfm`으로 렌더링.

---

## 3. 회의방 채팅

### 3-1. DB 스키마

```sql
-- 채팅 메시지
CREATE TABLE meeting_chat_messages (
    id          BIGSERIAL PRIMARY KEY,
    room_id     BIGINT NOT NULL REFERENCES meeting_rooms(id),
    user_id     BIGINT NOT NULL REFERENCES users(id),
    type        VARCHAR(16) NOT NULL DEFAULT 'TEXT',  -- TEXT|FILE
    content     TEXT,           -- TEXT 타입: 메시지 본문
    file_url    TEXT,           -- FILE 타입: S3/로컬 URL
    file_name   VARCHAR(255),   -- 원본 파일명
    file_size   BIGINT,         -- bytes
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 3-2. 지원 파일 형식

기존 `FileValidationUtil`의 허용 확장자 그대로 사용: `jpg, jpeg, png, gif, pdf, docx, xlsx, pptx, hwp, zip`

파일 크기 제한: 기존 `max-file-size: 10MB` 적용.

### 3-3. 채팅 흐름

**텍스트 메시지**
```
클라이언트 → STOMP /app/meetings/{id}/chat
             { type: "TEXT", content: "메시지" }
서버 → DB 저장 → /topic/meetings/{id}/chat broadcast
```

**파일 메시지**
```
클라이언트 → POST /api/meetings/{id}/chat/files (multipart)
서버 → S3/로컬 저장 → DB 저장 → /topic/meetings/{id}/chat broadcast
             { type: "FILE", fileUrl, fileName, fileSize }
```

**입장 시 이전 메시지 로드**
```
GET /api/meetings/{id}/chat?page=0&size=50
```

---

## 4. 초대 링크 공유

### 4-1. 방식

초대 토큰을 Redis에 저장 (TTL 설정 가능). 비로그인 사용자는 로그인 후 자동 리다이렉트.

### 4-2. Redis 키

```
meeting:invite:{token}  →  roomId (TTL: 24시간 기본, 생성 시 커스텀 가능)
```

### 4-3. API

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/meetings/{id}/invite` | 초대 링크 생성 (host만) |
| GET | `/api/invite/{token}` | 토큰 검증 + roomId 반환 |

**초대 링크 생성 요청**
```json
{ "expiresInHours": 24 }  // 1~168 (1주일 최대)
```

**초대 링크 생성 응답**
```json
{ "inviteUrl": "https://hyend.ac.kr/invite/abc123", "expiresAt": "..." }
```

**프론트 처리**
- `/invite/:token` 라우트 → 토큰 검증 → 비로그인이면 `/login?redirect=/invite/:token` → 로그인 후 자동 회의방 입장

---

## 5. AI 토큰 제한

기존 IP 기반 Bucket4j는 유지하고, AI 엔드포인트에 Redis 기반 사용자 쿼터 레이어 추가.

### 5-1. Redis 키 구조

| 키 | 값 | TTL |
|----|----|-----|
| `ai:whisper:user:{userId}:daily` | 누적 전사 시간(초) | 자정까지 |
| `ai:llm:user:{userId}:monthly` | 누적 LLM 토큰 수 | 월말까지 |
| `ai:whisper:meeting:{meetingId}` | 회의 누적 전사 시간(초) | 회의 종료 후 7일 |
| `ai:llm:meeting:{meetingId}:count` | 요약 생성 횟수 | 회의 종료 후 7일 |

### 5-2. 제한 기본값

| 항목 | 기본 제한 |
|------|---------|
| 사용자 Whisper / 일 | 3,600초 (60분) |
| 사용자 LLM / 월 | 100,000 토큰 |
| 회의당 최대 전사 | 10,800초 (3시간) |
| 회의당 LLM 요약 생성 | 3회 |

### 5-3. 인터셉터 처리

`AiQuotaInterceptor` (신규) → `/api/meetings/*/transcript`, `/api/meetings/*/end` 경로에 적용.

초과 시 응답:
```json
{
  "success": false,
  "message": "오늘 Whisper 할당량을 초과했습니다.",
  "data": { "remaining": 0, "resetAt": "2026-06-27T00:00:00" }
}
```

---

## 6. 웹 푸시 알림 (PWA + Firebase)

### 6-1. DB 스키마

```sql
CREATE TABLE user_fcm_tokens (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id),
    token        TEXT NOT NULL UNIQUE,
    user_agent   VARCHAR(255),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 6-2. API

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/notifications/subscribe` | FCM 토큰 등록 |
| DELETE | `/api/notifications/subscribe` | FCM 토큰 제거 |

### 6-3. 알림 발송 시점

| 이벤트 | 수신 대상 |
|--------|---------|
| 회의 초대 링크 생성 | — (링크 공유는 URL 복사, 알림 없음) |
| 회의 시작 (ACTIVE 전환) | 해당 방 초대된 참가자 이력 전원 |
| 회의록 생성 완료 | 해당 회의 참가자 전원 |
| 공지 등록 (관리자 작성) | 전체 회원 |

### 6-4. 프론트 PWA 설정

```
vite-plugin-pwa 추가
  - manifest.json: 앱 이름, 아이콘, theme_color
  - Service Worker: firebase-messaging-sw.js
    - 백그라운드 FCM 메시지 처리
    - 알림 클릭 → 해당 경로로 navigate
```

---

## 7. DB 마이그레이션 목록

현재 최신 버전 V13 기준으로 순차 추가.

| 파일 | 내용 |
|------|------|
| V14__create_meeting_rooms.sql | meeting_rooms, meeting_participants |
| V15__create_meeting_transcripts.sql | meeting_transcripts, meeting_minutes |
| V16__create_meeting_chat.sql | meeting_chat_messages |
| V17__create_user_fcm_tokens.sql | user_fcm_tokens |

---

## 8. 구현 계획

### Phase 1: 백엔드 기반 (2~3주)

1. **Flyway 마이그레이션** V14~V17 작성
2. **LiveKit 연동**
   - `build.gradle`에 LiveKit Java SDK 추가
   - `LiveKitConfig`, `LiveKitService` (방 생성, 토큰 발급)
3. **회의방 CRUD** — `MeetingRoom` 엔티티, Repository, Service, Controller
4. **WebSocket 설정** — STOMP + SockJS, `WebSocketConfig`
5. **오디오 청크 전송 + Whisper 연동** — `TranscriptService` (@Async)
6. **회의 종료 + GPT 요약** — `MinutesService`
7. **AI 쿼터 인터셉터** — `AiQuotaInterceptor` + Redis 카운터
8. **초대 토큰** — `InviteService` (Redis TTL 기반)
9. **채팅 API + STOMP** — `ChatMessageService`
10. **FCM 알림** — Firebase Admin SDK, `NotificationService`

### Phase 2: 프론트엔드 (2~3주)

1. **라우터 추가** — `/meetings`, `/meetings/new`, `/meetings/:id`, `/meetings/:id/minutes`, `/invite/:token`
2. **LiveKit 연동** — `@livekit/components-react` 설치, `useLiveKit` 훅
3. **AudioWorklet VAD** — `AudioCapture` 컴포넌트, `useAudioCapture` 훅
4. **STOMP WebSocket** — `stompjs` 설치, `useTranscriptWS`, `useChatWS` 훅
5. **회의방 UI** — 참가자 그리드, 실시간 자막 패널, 채팅 패널
6. **회의록 뷰어** — `react-markdown` + `remark-gfm`, 수동 편집 모드
7. **초대 링크 UI** — 링크 생성 모달, `/invite/:token` 진입 처리
8. **PWA 설정** — `vite-plugin-pwa`, `firebase-messaging-sw.js`
9. **FCM 토큰 등록** — 로그인 후 자동 구독

### Phase 3: 통합 테스트 + 배포 (1주)

1. LiveKit Cloud 계정 생성 + 환경변수 설정
2. Firebase 프로젝트 설정 + `google-services.json` / `FIREBASE_*` 환경변수
3. OpenAI API 키 환경변수 설정
4. Docker Compose 업데이트 (환경변수 추가)
5. 50명 부하 시나리오 테스트 (LiveKit 참가자 + Whisper 동시 요청)
6. AI 쿼터 제한 동작 검증

### 신규 의존성 목록

**백엔드 (build.gradle)**
```
io.livekit:livekit-server:0.5.x
com.aallam.openai:openai-client:3.x  // 또는 직접 WebClient 호출
com.google.firebase:firebase-admin:9.x
```

**프론트엔드 (package.json)**
```
@livekit/components-react
@livekit/client
@stomp/stompjs
sockjs-client
react-markdown
remark-gfm
firebase
vite-plugin-pwa
```
