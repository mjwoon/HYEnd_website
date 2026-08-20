# HY-END 웹사이트 운영 인수인계 문서

> 작성일: 2026-08-20  
> 대상: 신규 배포 담당자 / 유지보수 담당자

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [기술 스택](#3-기술-스택)
4. [디렉토리 구조](#4-디렉토리-구조)
5. [환경변수 설정](#5-환경변수-설정)
6. [프로덕션 배포](#6-프로덕션-배포)
7. [로컬 개발 환경](#7-로컬-개발-환경)
8. [데이터베이스 관리](#8-데이터베이스-관리)
9. [외부 서비스 연동](#9-외부-서비스-연동)
10. [기본 관리자 계정](#10-기본-관리자-계정)
11. [주요 기능 현황](#11-주요-기능-현황)
12. [모니터링 및 헬스체크](#12-모니터링-및-헬스체크)
13. [트러블슈팅](#13-트러블슈팅)
14. [보안 유의사항](#14-보안-유의사항)

---

## 1. 프로젝트 개요

HY-END는 한양대학교 학과/동아리 커뮤니티 웹사이트입니다.  
회원 관리, 공지사항, 게시판, 도서 대출, 화상 회의, 회의록 자동 생성 기능을 제공합니다.

**현재 운영 서버**: AWS EC2 (`13.209.76.52`)

| 서비스 | URL |
|--------|-----|
| 메인 프론트엔드 | `http://13.209.76.52` (포트 80) |
| 어드민 패널 | `http://13.209.76.52:81` (포트 81) |
| 백엔드 API | `http://13.209.76.52:8080` |
| Swagger UI | `http://13.209.76.52:8080/swagger-ui/index.html` |
| 헬스체크 | `http://13.209.76.52:8080/actuator/health` |

---

## 2. 시스템 아키텍처

```
[ 브라우저 ]
     │
     ├─── 포트 80 ──► [ Nginx (frontend 컨테이너) ]
     │                    └─ /api/, /ws/ 요청은 backend:8080으로 프록시
     │
     ├─── 포트 81 ──► [ Nginx (admin 컨테이너) ]
     │                    └─ /api/ 요청은 backend:8080으로 프록시
     │
     └─── 포트 8080 ► [ Spring Boot (backend 컨테이너) ]
                           ├─ PostgreSQL (db 컨테이너, 포트 5432)
                           ├─ Redis      (redis 컨테이너, 포트 6379)
                           ├─ AWS S3     (파일 저장소, 외부)
                           ├─ LiveKit    (화상 회의, 외부)
                           └─ OpenAI     (음성→텍스트 변환, 외부)
```

모든 컨테이너는 Docker Compose로 관리됩니다.  
- **frontend-net**: frontend ↔ backend 통신용 내부 네트워크
- **backend-net**: backend ↔ db ↔ redis 통신용 내부 네트워크 (외부 미노출)

---

## 3. 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| **프론트엔드** | React + Vite + TypeScript | React 19, Vite 6, TS 5.7 |
| | 상태관리 | Zustand 5, TanStack Query 5 |
| | 스타일링 | styled-components 6 |
| | 실시간 통신 | STOMP over SockJS, LiveKit SDK |
| **어드민** | React + Vite + TypeScript | (frontend와 동일 스택) |
| **백엔드** | Spring Boot | 4.0.5 |
| | 언어 | Java 21 |
| | ORM / DB 마이그레이션 | JPA (Hibernate) + Flyway |
| | 인증 | JWT (jjwt 0.12.6) + Spring Security |
| | WebSocket | STOMP (Spring WebSocket) |
| | Rate Limiting | Bucket4j + Caffeine |
| **데이터베이스** | PostgreSQL | 16 |
| **캐시/세션** | Redis | 7 |
| **파일 저장소** | AWS S3 (prod) / 로컬 (dev) | — |
| **화상 회의** | LiveKit | — |
| **음성 변환** | OpenAI Whisper | whisper-1 |
| **회의 요약** | OpenAI GPT | gpt-4o-mini |
| **푸시 알림** | Web Push (VAPID) | — |
| **빌드/배포** | Docker + Docker Compose | — |

---

## 4. 디렉토리 구조

```
HYEnd_website/
├── frontend/          # 메인 사용자 웹앱 (React)
│   ├── src/
│   │   ├── pages/     # 라우팅 페이지 컴포넌트
│   │   ├── components/# 공통 UI 컴포넌트
│   │   ├── services/  # API 호출 레이어
│   │   ├── store/     # Zustand 전역 상태
│   │   └── hooks/     # 커스텀 훅
│   ├── nginx.conf     # Nginx 설정 (API 프록시 포함)
│   └── Dockerfile     # 멀티스테이지 빌드 (Node→Nginx)
│
├── admin/             # 관리자 웹앱 (React)
│   └── Dockerfile
│
├── backend/           # Spring Boot API 서버
│   ├── src/main/java/com/hyend/
│   │   ├── controller/# REST 컨트롤러
│   │   ├── service/   # 비즈니스 로직
│   │   ├── entity/    # JPA 엔티티
│   │   ├── repository/# Spring Data JPA 레포지토리
│   │   ├── dto/       # 요청/응답 DTO
│   │   ├── security/  # JWT 필터, Spring Security 설정
│   │   ├── config/    # 설정 클래스
│   │   └── exception/ # 전역 예외 처리
│   ├── src/main/resources/
│   │   ├── application.yml      # 공통 설정
│   │   ├── application-dev.yml  # 로컬 개발용
│   │   ├── application-prod.yml # 운영 환경용
│   │   └── db/migration/        # Flyway SQL 마이그레이션 (V1~V21)
│   └── Dockerfile
│
├── docker-compose.yml       # 로컬 개발용 Compose
├── docker-compose.prod.yml  # 운영 배포용 Compose
├── .env.example             # 환경변수 템플릿
└── docs/                    # 문서
    ├── API.md               # API 명세 (backend/API.md에도 있음)
    └── HANDOVER.md          # 이 문서
```

---

## 5. 환경변수 설정

루트의 `.env.example`을 복사해 `.env`를 만들고 각 값을 채웁니다.

```bash
cp .env.example .env
```

| 변수명 | 필수 여부 | 설명 |
|--------|----------|------|
| `SECRET_KEY` | **필수** | JWT 서명 키. `openssl rand -base64 32`로 생성. 256-bit 이상 |
| `DB_USER` | 필수 (prod) | PostgreSQL 사용자명 |
| `DB_PASSWORD` | 필수 (prod) | PostgreSQL 비밀번호 |
| `FILE_STORAGE_TYPE` | 필수 | `local` 또는 `s3` |
| `AWS_S3_BUCKET` | S3 사용 시 필수 | S3 버킷명 |
| `AWS_S3_REGION` | S3 사용 시 필수 | 기본값: `ap-northeast-2` |
| `AWS_ACCESS_KEY_ID` | S3 사용 시 필수 | IAM 액세스 키 ID |
| `AWS_SECRET_ACCESS_KEY` | S3 사용 시 필수 | IAM 시크릿 액세스 키 |
| `LIVEKIT_API_KEY` | 화상회의 사용 시 필수 | LiveKit 프로젝트 API 키 |
| `LIVEKIT_API_SECRET` | 화상회의 사용 시 필수 | LiveKit 프로젝트 API 시크릿 |
| `LIVEKIT_URL` | 화상회의 사용 시 필수 | `https://your-project.livekit.cloud` |
| `VAPID_PUBLIC_KEY` | 푸시 알림 사용 시 필수 | VAPID 공개 키 |
| `VAPID_PRIVATE_KEY` | 푸시 알림 사용 시 필수 | VAPID 비공개 키 |
| `OPENAI_API_KEY` | AI 기능 사용 시 필수 | OpenAI API 키 |
| `APP_BASE_URL` | 필수 | 서버 기본 URL (예: `http://13.209.76.52`) |

> **⚠️ 주의**: `SECRET_KEY`가 없으면 백엔드가 기동에 실패합니다(fail-fast).  
> **⚠️ 주의**: `.env` 파일은 절대 git에 커밋하지 마세요. `.gitignore`에 이미 포함되어 있습니다.

---

## 6. 프로덕션 배포

### 최초 서버 세팅 (EC2 기준)

```bash
# 1. Docker 및 Docker Compose 설치 (Amazon Linux 2023 기준)
sudo yum update -y
sudo yum install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# Docker Compose 플러그인 설치
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 2. 코드 클론
git clone <저장소 URL> /app/HYEnd_website
cd /app/HYEnd_website

# 3. 환경변수 파일 작성
cp .env.example .env
# .env 파일을 편집기로 열어 각 값 입력
nano .env
```

### 배포 실행

```bash
cd /app/HYEnd_website

# 프로덕션 Compose 파일로 빌드 및 실행
docker compose -f docker-compose.prod.yml up -d --build

# 상태 확인
docker compose -f docker-compose.prod.yml ps

# 로그 확인
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### 업데이트 배포 (코드 변경 후)

```bash
cd /app/HYEnd_website

# 코드 최신화
git pull origin master

# 재빌드 및 무중단 재시작
docker compose -f docker-compose.prod.yml up -d --build

# 오래된 이미지 정리 (선택)
docker image prune -f
```

### 프로덕션 포트 정리

| 서비스 | 호스트 포트 | 컨테이너 포트 | 설명 |
|--------|------------|--------------|------|
| frontend | 80 | 80 (Nginx) | 메인 웹사이트 |
| admin | 81 | 80 (Nginx) | 어드민 패널 |
| backend | 8080 | 8080 | Spring Boot API |
| db | (외부 미노출) | 5432 | PostgreSQL |
| redis | (외부 미노출) | 6379 | Redis |

> `docker-compose.prod.yml`에서 db와 redis는 외부 포트가 없어 인터넷에서 직접 접근 불가.

---

## 7. 로컬 개발 환경

자세한 내용은 루트의 `README.md` 참고. 요약:

```bash
# 전체 스택 실행 (개발용)
cp .env.example .env   # 최초 1회
docker compose up -d

# DB, Redis만 켜고 백엔드는 IDE에서 실행하는 경우
docker compose up -d db redis
cd backend && ./gradlew bootRun
```

**개발 환경 포트**

| 서비스 | 포트 |
|--------|------|
| frontend (Docker) | 5173 |
| admin (Docker) | 5174 |
| backend | 8080 |
| PostgreSQL | 55432 |
| Redis | 56379 |

---

## 8. 데이터베이스 관리

### Flyway 마이그레이션

DB 스키마는 **Flyway**로 버전 관리됩니다. 앱 기동 시 자동으로 미적용 마이그레이션이 실행됩니다.

```
backend/src/main/resources/db/migration/
├── V1__create_users.sql
├── V2__create_categories.sql
├── V3__create_announcements.sql
├── V4__create_events.sql
├── V5__create_books.sql
├── V6__create_inquiries.sql
├── V7__create_attachments.sql
├── V8__create_refresh_tokens.sql
├── V9__create_seed_data.sql         # 기본 카테고리 + 관리자 계정 시드
├── V10__fix_admin_password.sql
├── V11__create_posts.sql
├── V12__add_book_rental_extended.sql
├── V13__create_scraps.sql
├── V14__create_meeting_rooms.sql
├── V15__create_meeting_transcripts.sql
├── V16__create_meeting_chat.sql
├── V17__create_user_fcm_tokens.sql
├── V18__drop_refresh_tokens.sql
├── V19__replace_fcm_with_push_subscriptions.sql
├── V20__create_meeting_minutes.sql
└── V21__add_indexes.sql
```

> **규칙**: 새 스키마 변경은 반드시 `V22__...sql`, `V23__...sql` 형식으로 추가. 기존 파일 수정 절대 금지.

### DB 직접 접속 (운영 서버에서)

```bash
# 운영 환경 (컨테이너 내부)
docker compose -f docker-compose.prod.yml exec db psql -U ${DB_USER} -d hyend

# 로컬 개발 환경
psql -h localhost -p 55432 -U user -d hyend
```

### 백업 (운영)

```bash
# 데이터 백업
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U ${DB_USER} hyend > backup_$(date +%Y%m%d).sql

# 복원
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U ${DB_USER} hyend < backup_20260820.sql
```

---

## 9. 외부 서비스 연동

### AWS S3 (파일 저장)

- 운영 환경에서 `FILE_STORAGE_TYPE=s3`로 설정 시 파일을 S3에 저장
- IAM 사용자에 S3 버킷 읽기/쓰기 권한 필요 (`s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`)
- 허용 파일 확장자: `jpg, jpeg, png, gif, pdf, docx, xlsx, pptx, hwp, zip`
- 요청당 최대 5개 파일, 파일당 최대 10MB, 요청 전체 최대 50MB

### LiveKit (화상 회의)

- [LiveKit Cloud](https://livekit.io) 또는 자체 호스팅 서버 필요
- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` 환경변수 설정 필요

### OpenAI (회의록 AI)

- Whisper: 음성 파일 → 텍스트 변환
- GPT-4o-mini: 회의록 텍스트 요약
- AI 사용 할당량 제한 (`application.yml` 의 `ai.quota` 섹션 참고):
  - Whisper 일일 최대: 3600초
  - 회의당 Whisper 최대: 10800초
  - GPT 월간 최대: 100,000 토큰
  - 회의당 GPT 최대 호출: 3회

### Web Push (VAPID 푸시 알림)

- Firebase 없이 브라우저 네이티브 Web Push 사용
- VAPID 키 쌍 생성 방법:

```bash
# npx 사용
npx web-push generate-vapid-keys

# 출력 예시
# Public Key: BG...
# Private Key: ...
```

---

## 10. 기본 관리자 계정

최초 배포 시 Flyway 마이그레이션(V9, V10)으로 관리자 계정이 자동 생성됩니다.

| 항목 | 값 |
|------|----|
| 이메일 | `admin@hyend.ac.kr` |
| 초기 비밀번호 | `Admin1234!` |
| 역할 | `ADMIN` |

> **⚠️ 반드시 최초 로그인 후 비밀번호를 변경하세요.**  
> 어드민 패널(`http://서버IP:81`) 또는 API를 통해 변경 가능합니다.

### 권한 체계

| 역할 | 권한 |
|------|------|
| (비인증) | 공개 GET (공지사항, 이벤트, 도서 목록, 파일 다운로드) |
| `USER` | 로그인 후 게시판, 회의, 스크랩, 문의 등 |
| `STAFF` | 공지사항/이벤트/게시물 생성·수정 |
| `ADMIN` | 전체 관리 (삭제, 카테고리 관리, 사용자 관리) |

---

## 11. 주요 기능 현황

### 구현 완료

| 기능 | 설명 |
|------|------|
| 회원 가입/로그인 | JWT 기반 인증 (액세스 15분 / 리프레시 7일) |
| 공지사항 | 목록, 상세, 고정, 카테고리 필터, 검색 |
| 게시판 | 게시글 CRUD, 스크랩 |
| 파일 첨부 | 공지/게시글에 파일 첨부 (S3 또는 로컬) |
| 화상 회의 | LiveKit 기반 방 생성/참여/초대 |
| 회의 채팅 | STOMP WebSocket 기반 실시간 채팅 |
| 회의록 | 음성 녹음 → Whisper 변환 → GPT 요약 |
| 도서 대출 | 도서 목록 조회, 대출 신청 (대출 7일 / 연장 7일) |
| 어드민 패널 | 사용자 관리, 역할 변경 |
| 푸시 알림 | Web Push (VAPID) |

### 미구현 (스텁 존재, DTO 정의 완료)

| 기능 | 이슈 태그 |
|------|----------|
| 이벤트 API 완성 | TODO [H-6] |
| 카테고리 API 완성 | TODO [H-5] |
| 문의 API 완성 | TODO [H-8] |

> 컨트롤러 클래스는 있으나 서비스 로직이 stub 상태입니다. DTO와 엔티티는 정의되어 있어 구현만 추가하면 됩니다.

---

## 12. 모니터링 및 헬스체크

### 헬스체크 엔드포인트

```bash
curl http://13.209.76.52:8080/actuator/health
# {"status":"UP"}
```

Docker Compose의 `healthcheck`에서 이 엔드포인트를 사용합니다. backend가 healthy 상태여야 frontend/admin 컨테이너가 시작됩니다.

### Prometheus 메트릭

```bash
curl http://13.209.76.52:8080/actuator/prometheus
```

Prometheus + Grafana로 메트릭 수집/시각화 연동 가능합니다.

### 로그 확인

```bash
# 전체 로그 (마지막 100줄)
docker compose -f docker-compose.prod.yml logs --tail=100

# 특정 서비스 실시간 로그
docker compose -f docker-compose.prod.yml logs -f backend

# 백엔드 로그 레벨:
# - 운영(prod): root=INFO, com.hyend=INFO
# - 개발(dev):  root=INFO, com.hyend=DEBUG, Spring Security=DEBUG
```

---

## 13. 트러블슈팅

### 백엔드가 시작되지 않을 때

```bash
# 로그 확인
docker compose -f docker-compose.prod.yml logs backend

# 흔한 원인:
# 1. SECRET_KEY 환경변수 미설정 → .env 파일 확인
# 2. DB 연결 실패 → db 컨테이너 헬스체크 통과 여부 확인
# 3. Flyway 마이그레이션 실패 → 마이그레이션 SQL 오류 확인
```

### 포트 충돌 (`port is already allocated`)

```bash
# 점유 중인 프로세스 확인 (Mac/Linux)
lsof -i :8080
lsof -i :80

# 기존 컨테이너 강제 삭제
docker rm -f <컨테이너명>
```

### DB 커넥션 에러 (로컬 개발)

```bash
# DB만 먼저 실행
docker compose up -d db redis

# 포트가 다를 경우 환경변수 오버라이드
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:55432/hyend \
SPRING_DATA_REDIS_PORT=56379 \
./gradlew bootRun
```

### Docker 무한 로딩 (Mac 한정)

Docker Desktop의 내부 VM 네트워크 마비 현상. 명령어로 해결 불가.
1. 메뉴바 고래 아이콘 클릭 → `Restart` 또는 `Quit Docker Desktop`
2. 완전히 재시작(초록불 확인) 후 다시 시도

### Flyway 마이그레이션 실패

```bash
# 마이그레이션 상태 확인 (Flyway history 테이블)
docker compose -f docker-compose.prod.yml exec db \
  psql -U ${DB_USER} -d hyend -c "SELECT * FROM flyway_schema_history ORDER BY installed_rank;"

# 실패한 마이그레이션이 있다면 수동으로 해결 후 재시작
# application.yml에 ignore-migration-patterns: "*:missing" 설정으로 missing 마이그레이션은 무시
```

### 파일 업로드 실패

- 파일 크기 제한: 단일 파일 10MB, 요청 전체 50MB
- 허용 확장자 확인: `jpg, jpeg, png, gif, pdf, docx, xlsx, pptx, hwp, zip`
- S3 연결 문제: AWS 자격증명 및 버킷 권한 확인

---

## 14. 보안 유의사항

1. **JWT 시크릿 교체 시**: 기존 토큰이 모두 무효화됩니다 (모든 사용자 재로그인 필요).
2. **AWS 키 유출 시**: IAM에서 즉시 해당 키를 비활성화·삭제하고 새 키 발급.
3. **기본 관리자 비밀번호**: 배포 즉시 변경 필수 (`Admin1234!`).
4. **DB 포트**: 프로덕션 Compose에서 외부 미노출. EC2 보안 그룹에서 5432, 6379 포트 차단 유지.
5. **API Rate Limiting**: Bucket4j + Caffeine으로 적용 중. 과도한 요청은 자동 차단.
6. **.env 파일**: 절대 git 커밋 금지. 서버 접근 권한자만 열람 가능하도록 파일 권한 설정 권장 (`chmod 600 .env`).

---

## 15. CI/CD 파이프라인

GitHub Actions로 자동화된 테스트·배포 파이프라인이 구성되어 있습니다 (`.github/workflows/ci.yml`).

### 동작 조건

| 이벤트 | 동작 |
|--------|------|
| `master`, `dev` 브랜치에 push 또는 PR | 백엔드 테스트 + 프론트엔드 빌드 검증 |
| `master` 브랜치에 push (테스트 통과 시) | EC2 서버 자동 배포 |

### 파이프라인 구성

```
push to master
    │
    ├── backend-test  (PostgreSQL + Redis 서비스 컨테이너 포함)
    │       └── ./gradlew test
    │
    ├── frontend-check
    │       ├── tsc --noEmit (타입 검사)
    │       └── npm run build
    │
    └── deploy  (위 두 job 모두 통과 시에만 실행)
            ├── SSH로 EC2 접속
            ├── git pull origin master
            ├── .env 파일 재생성 (GitHub Secrets → 환경변수)
            ├── docker compose -f docker-compose.prod.yml up -d --build
            ├── 헬스체크 대기 (최대 2분, 5초 간격)
            └── docker image prune -f
```

### GitHub Secrets 등록 필요 항목

CI/CD가 정상 동작하려면 GitHub 저장소 Settings → Secrets and variables → Actions 에 다음 값이 등록되어 있어야 합니다.

| Secret 이름 | 설명 |
|-------------|------|
| `EC2_HOST` | EC2 퍼블릭 IP 또는 도메인 |
| `EC2_USER` | EC2 SSH 사용자명 (예: `ec2-user`) |
| `EC2_SSH_KEY` | EC2 SSH 프라이빗 키 (PEM 파일 전체 내용) |
| `EC2_WORKDIR` | 서버의 프로젝트 경로 (예: `/app/HYEnd_website`) |
| `JWT_SECRET` | JWT 서명 키 |
| `DB_USER` | DB 사용자명 |
| `DB_PASSWORD` | DB 비밀번호 |
| `AWS_S3_BUCKET` | S3 버킷명 |
| `AWS_S3_REGION` | S3 리전 |
| `AWS_ACCESS_KEY_ID` | IAM 액세스 키 |
| `AWS_SECRET_ACCESS_KEY` | IAM 시크릿 키 |
| `LIVEKIT_API_KEY` | LiveKit API 키 |
| `LIVEKIT_API_SECRET` | LiveKit API 시크릿 |
| `LIVEKIT_URL` | LiveKit 서버 URL |
| `VAPID_PUBLIC_KEY` | Web Push 공개 키 |
| `VAPID_PRIVATE_KEY` | Web Push 비공개 키 |
| `OPENAI_API_KEY` | OpenAI API 키 |
| `APP_BASE_URL` | 서버 기본 URL |

> Secrets를 새로 등록하거나 변경하면 다음 배포부터 반영됩니다.  
> EC2_SSH_KEY에는 `-----BEGIN RSA PRIVATE KEY-----` 포함 전체 PEM 내용을 붙여넣어야 합니다.

### 배포 확인 방법

```bash
# GitHub Actions 탭에서 워크플로우 실행 결과 확인
# 또는 EC2에서 직접 확인
docker compose -f docker-compose.prod.yml ps
curl http://localhost:8080/actuator/health
```

---

## 16. 사용자 관리 (어드민 패널)

어드민 패널(`http://서버IP:81`)에서 모든 사용자 관리가 가능합니다.

### 역할 변경

어드민 패널 → 사용자 목록 → 사용자 선택 → 역할 변경  
또는 API 직접 호출:

```bash
# 특정 사용자를 STAFF로 승격
curl -X PATCH http://서버IP:8080/api/admin/users/{userId}/role \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role": "STAFF"}'
```

역할 값: `USER` | `STAFF` | `ADMIN`

### 사용자 목록 조회 API

```bash
# 전체 목록 (페이지네이션)
GET /api/admin/users?page=0&size=20

# 역할 필터
GET /api/admin/users?role=STAFF

# 이름/이메일 검색
GET /api/admin/users?keyword=홍길동
```

---

## 관련 문서

- `README.md` — 로컬 개발 환경 세팅 가이드 (상세)
- `SECURITY.md` — 시크릿 관리 가이드
- `backend/API.md` — REST API 전체 명세
- `backend/src/main/resources/application.yml` — 공통 서버 설정
- `docker-compose.prod.yml` — 프로덕션 Compose 정의
- `.github/workflows/ci.yml` — CI/CD 파이프라인 정의
