# HY-END 웹서비스 통합 인수인계 문서

> 최종 업데이트: 2026-08-21
> 대상: 배포·운영·유지보수 담당자 및 신규 개발자
> 이 문서 하나로 배포, 운영, 로컬 개발, 트러블슈팅을 모두 다룬다.

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [현재 운영 환경 (중요)](#2-현재-운영-환경-중요)
3. [시스템 아키텍처](#3-시스템-아키텍처)
4. [기술 스택](#4-기술-스택)
5. [앞으로 배포하는 법 (자동 배포)](#5-앞으로-배포하는-법-자동-배포)
6. [GitHub Secrets](#6-github-secrets)
7. [서버 직접 접속 / 운영 명령어](#7-서버-직접-접속--운영-명령어)
8. [도메인 / SSL](#8-도메인--ssl)
9. [환경변수](#9-환경변수)
10. [디렉토리 구조](#10-디렉토리-구조)
11. [로컬 개발 환경](#11-로컬-개발-환경)
12. [데이터베이스 관리 (Flyway 포함)](#12-데이터베이스-관리-flyway-포함)
13. [외부 서비스 연동](#13-외부-서비스-연동)
14. [기본 관리자 계정 / 권한 체계](#14-기본-관리자-계정--권한-체계)
15. [주요 기능 현황](#15-주요-기능-현황)
16. [모니터링 및 헬스체크](#16-모니터링-및-헬스체크)
17. [트러블슈팅](#17-트러블슈팅)
18. [보안 유의사항](#18-보안-유의사항)
19. [남은 정리 작업 (TODO)](#19-남은-정리-작업-todo)
20. [부록: 서버 이전 이력](#20-부록-서버-이전-이력)

---

## 1. 프로젝트 개요

HY-END는 한양대학교 학과/동아리 커뮤니티 웹사이트다.
회원 관리, 공지사항, 게시판, 도서 대출, 화상 회의, 회의록 자동 생성 기능을 제공한다.

---

## 2. 현재 운영 환경 (중요)

| 항목 | 값 |
|---|---|
| 서비스 URL | **https://hyend.kr** (https://www.hyend.kr) |
| 서버 | AWS EC2 (Ubuntu 24.04), Elastic IP `16.184.60.186` |
| AWS 계정 | `126052242187` (서울 리전 `ap-northeast-2`) |
| SSH 접속 유저 | `ubuntu` |
| 코드 경로(서버) | `/home/ubuntu/HYEnd_website` |
| GitHub | https://github.com/mjwoon/HYEnd_website |
| 배포 브랜치 | `master` (push 시 자동 배포) |
| 파일 저장 | AWS S3 버킷 `hyend-file-storage-126052242187` |
| SSL | Let's Encrypt (certbot 자동 갱신, 초기 만료일 2026-11-18) |

### 접속 URL 정리

| 대상 | URL |
|---|---|
| 메인 프론트엔드 | https://hyend.kr |
| 어드민 패널 | http://16.184.60.186:81 (아직 서브도메인 미연결, 포트로 접근) |
| 백엔드 API | https://hyend.kr/api/... (프론트 nginx 프록시 경유) |
| Swagger UI | http://16.184.60.186:8080/swagger-ui/index.html |
| 헬스체크 | http://16.184.60.186:8080/actuator/health |

> 참고: 어드민(81)과 백엔드 직접 포트(8080)는 아직 도메인/HTTPS에 연결되어 있지 않다. 필요 시 서브도메인(`admin.hyend.kr` 등) 추가 작업이 필요하다.

---

## 3. 시스템 아키텍처

```
사용자 → https://hyend.kr
          │  DNS: hosting.kr, A레코드 (hyend.kr / www) → 16.184.60.186
          ▼
   [ EC2 서버 16.184.60.186 ]
          │
   호스트 nginx (80/443)  ← SSL 종료(certbot Let's Encrypt 인증서)
          │  리버스 프록시 → localhost:8081
          ▼
   docker compose (docker-compose.prod.yml)
     ├─ frontend  (호스트 8081 → 컨테이너 80, nginx)   ─┐
     ├─ admin     (호스트 81   → 컨테이너 80, nginx)    │ 컨테이너 내부 nginx가
     ├─ backend   (8080, Spring Boot)                  │ /api/, /ws/ 를 backend로 프록시
     ├─ db        (PostgreSQL 16, 내부 전용)            │
     └─ redis     (Redis 7, 내부 전용)                 ─┘
```

**핵심 흐름:** 호스트 nginx가 80/443을 받아 SSL을 처리한 뒤 프론트 컨테이너(8081)로 프록시한다. 프론트 컨테이너 내부의 nginx가 다시 `/api/`, `/ws/`를 backend(8080)로 넘긴다.

**네트워크:**
- `frontend-net`: frontend/admin ↔ backend
- `backend-net`: backend ↔ db ↔ redis (외부 미노출)

---

## 4. 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| **프론트엔드** | React + Vite + TypeScript | React 19, Vite 6, TS 5.7 |
| | 상태관리 | Zustand 5, TanStack Query 5 |
| | 스타일링 | styled-components 6 |
| | 실시간 통신 | STOMP over SockJS, LiveKit SDK |
| **어드민** | React + Vite + TypeScript | (frontend와 동일 스택) |
| **백엔드** | Spring Boot | 4.0.5 |
| | 언어 | Java 21 |
| | ORM / 마이그레이션 | JPA (Hibernate) + Flyway |
| | 인증 | JWT (jjwt 0.12.6) + Spring Security |
| | WebSocket | STOMP (Spring WebSocket) |
| | Rate Limiting | Bucket4j + Caffeine |
| **데이터베이스** | PostgreSQL | 16 |
| **캐시/세션** | Redis | 7 |
| **파일 저장소** | AWS S3 (prod) / 로컬 (dev) | — |
| **화상 회의** | LiveKit (외부 클라우드) | — |
| **음성 변환** | OpenAI Whisper | whisper-1 |
| **회의 요약** | OpenAI GPT | gpt-4o-mini |
| **푸시 알림** | Web Push (VAPID) | — |
| **빌드/배포** | Docker + Docker Compose + GitHub Actions | — |

---

## 5. 앞으로 배포하는 법 (자동 배포)

**배포는 완전히 자동화되어 있다.** 코드를 고치고 `master`에 push하면 끝이다.

```bash
git add .
git commit -m "수정 내용"
git push origin master
```

push하면 GitHub Actions가 자동으로:
1. `backend-test` — 백엔드 테스트 (PostgreSQL/Redis 서비스 컨테이너 포함)
2. `frontend-check` — 타입 검사(`tsc --noEmit`) + 빌드(`npm run build`)
3. 둘 다 통과하면 `deploy` — 서버 SSH 접속 → `git pull` → `.env` 재생성(Secrets 기반) → `docker compose -f docker-compose.prod.yml up -d --build` → 헬스체크(최대 2분) → 이미지 정리

몇 분 뒤 https://hyend.kr 에 자동 반영된다. **SSH로 들어가 수동 빌드할 필요 없다.**

### 배포 규칙

- **`master`에 push할 때만 배포된다.** `dev` 등 다른 브랜치는 테스트만 돌고 배포 안 됨. 안전하게: `dev`에서 작업 → 검증 → `master` 머지.
- **테스트 실패 시 배포 안 됨** (`deploy`는 `needs: [backend-test, frontend-check]`). 깨진 코드가 서버로 나가는 걸 막는 안전장치.
- 진행 상황은 GitHub → **Actions 탭**에서 확인. 초록불 3개면 성공.

### ⚠️ 반드시 기억할 두 가지

1. **`.env`는 GitHub Secrets가 관리한다.** 자동배포가 매번 `.env`를 Secrets 값으로 새로 만든다. 서버에서 손으로 `.env`를 고쳐도 다음 배포에 덮어써진다. → 환경변수 변경은 **GitHub Secrets에서** 한다.
2. **인프라 설정 파일(nginx.conf, docker-compose.prod.yml)은 커밋해야 유지된다.** 서버에서 직접 고친 것은 다음 `git pull` 때 덮어써진다.

---

## 6. GitHub Secrets

자동배포(`.github/workflows/ci.yml`)가 참조. 변경은 GitHub → **Settings → Secrets and variables → Actions**. (값 자체는 보안상 문서에 미기재)

| Secret | 용도 |
|---|---|
| `EC2_HOST` | 서버 IP (`16.184.60.186`) |
| `EC2_USER` | SSH 유저 (`ubuntu`) |
| `EC2_SSH_KEY` | 서버 접속 개인키(.pem) **전체 내용** (`-----BEGIN ... KEY-----` 포함) |
| `EC2_WORKDIR` | 서버 코드 경로 (`/home/ubuntu/HYEnd_website`) |
| `JWT_SECRET` | JWT 서명 키 |
| `DB_USER` / `DB_PASSWORD` | PostgreSQL 접속 |
| `AWS_S3_BUCKET` / `AWS_S3_REGION` | 파일 저장 S3 |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 접근 IAM 키 |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_URL` | 화상 회의 |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | 웹 푸시 알림 |
| `OPENAI_API_KEY` | AI 기능 |
| `APP_BASE_URL` | 앱 기준 URL (`https://hyend.kr`) |
| `VITE_API_URL` | 프론트가 부르는 API 주소 (`https://hyend.kr`) |
| `VITE_WS_URL` | WebSocket 주소 (`wss://hyend.kr`) |

> 저장소를 옮기거나 서버를 바꾸면 위 Secrets를 모두 재등록해야 한다.
> `gh` CLI로 일괄 등록 가능: `gh secret set NAME --body "값" --repo mjwoon/HYEnd_website`

---

## 7. 서버 직접 접속 / 운영 명령어

자동배포로 대부분 처리되지만, 로그 확인·긴급 대응 시 SSH 접속.

```bash
ssh -i <키파일경로>/hyend-new-key.pem ubuntu@16.184.60.186
```

- 키 파일 `hyend-new-key.pem`은 **분실 시 접속 불가**. 안전하게 보관·인수인계할 것.
- 처음 쓰는 키면 권한 설정: `chmod 400 hyend-new-key.pem`

### ⚠️ SSH가 무한 대기(timeout)로 안 될 때 (자주 발생)

보안 그룹에서 SSH(22)를 **특정 IP만 허용**하도록 설정되어 있다. 공인 IP가 바뀌면 막힌다.
해결: AWS 콘솔 → EC2 → 인스턴스 → 보안 탭 → 보안 그룹 → 인바운드 규칙 편집 → SSH 소스를 **"내 IP"**로 재설정.
현재 IP 확인: `curl -s https://checkip.amazonaws.com`

> 웹사이트(80/443)는 전체 공개라 SSH만 막혀도 사이트는 정상 작동한다.

### 자주 쓰는 명령어

```bash
cd ~/HYEnd_website

# 컨테이너 상태
docker compose -f docker-compose.prod.yml ps

# 로그
docker logs hyend_website-backend-1 --tail 50
docker compose -f docker-compose.prod.yml logs -f backend

# 서버 자체 응답 확인
curl -I http://localhost           # 호스트 nginx (80/443)
curl -I http://localhost:8081      # 프론트 컨테이너

# 수동 재시작 / 재빌드 (보통 불필요, 자동배포 사용)
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml up -d --build

# 오래된 이미지 정리
docker image prune -f
```

### 프로덕션 포트

| 서비스 | 호스트 포트 | 컨테이너 포트 | 비고 |
|---|---|---|---|
| frontend | **8081** | 80 | 호스트 nginx가 80/443 → 8081 프록시 |
| admin | 81 | 80 | |
| backend | 8080 | 8080 | |
| db | (미노출) | 5432 | 외부 접근 불가 |
| redis | (미노출) | 6379 | 외부 접근 불가 |

> frontend가 `8081:80`인 이유: 호스트 nginx가 80을 써야 하므로 컨테이너가 물러나 있다. `80:80`으로 되돌리면 호스트 nginx와 충돌한다.

---

## 8. 도메인 / SSL

- **도메인:** hyend.kr — hosting.kr에서 구매·관리
- **DNS:** hosting.kr DNS 관리 → A레코드 2개
  - `hyend.kr` → `16.184.60.186`
  - `www` → `16.184.60.186`
  - **파킹/포워딩은 OFF 유지** (켜면 A레코드와 충돌)
  - CNAME에 IP를 넣지 말 것 (반드시 A레코드). 잘못 넣으면 존 전체 반영이 실패한다.
- **SSL:** Let's Encrypt. 호스트 nginx + certbot으로 발급, 자동 갱신 등록됨.
- 호스트 nginx 설정 파일: `/etc/nginx/sites-available/hyend`

### SSL 관련 명령어

```bash
sudo certbot certificates      # 현재 인증서 상태
sudo certbot renew             # 수동 갱신 (보통 자동이라 불필요)

# 재발급 / 도메인 추가 시 (www는 대괄호/링크 없이 순수 텍스트로 입력)
sudo certbot --nginx -d hyend.kr -d www.hyend.kr
```

> HTTPS 적용 후 프론트는 API를 `https://hyend.kr`로 호출해야 한다(mixed content 방지).
> 관련 값은 Secrets의 `VITE_API_URL`, `VITE_WS_URL`, `APP_BASE_URL`로 관리된다.

---

## 9. 환경변수

로컬은 `.env.example`을 복사해 `.env`를 만들고 채운다. 운영은 GitHub Secrets가 배포 시 `.env`를 생성한다.

```bash
cp .env.example .env
```

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `SECRET_KEY` (=`JWT_SECRET`) | **필수** | JWT 서명 키. `openssl rand -base64 32` (256-bit 이상). 없으면 백엔드 기동 실패(fail-fast) |
| `DB_USER` / `DB_PASSWORD` | 필수(prod) | PostgreSQL 계정 |
| `FILE_STORAGE_TYPE` | 필수 | `local` 또는 `s3` (운영 `s3`) |
| `AWS_S3_BUCKET` / `AWS_S3_REGION` | S3 사용 시 | 버킷명 / `ap-northeast-2` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 사용 시 | IAM 키 |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_URL` | 화상회의 | LiveKit 프로젝트 정보 |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | 푸시 알림 | VAPID 키 쌍 |
| `OPENAI_API_KEY` | AI 기능 | OpenAI API 키 |
| `APP_BASE_URL` | 필수 | 서버 기본 URL (`https://hyend.kr`) |
| `VITE_API_URL` | 필수 | 프론트 API 주소 (`https://hyend.kr`) |
| `VITE_WS_URL` | 필수 | WebSocket 주소 (`wss://hyend.kr`) |

> **주의:** `.env`는 절대 git에 커밋 금지(`.gitignore`에 포함). `.env.example`에는 플레이스홀더만 둔다.
> 로컬(dev)에는 `application-dev.yml`/`docker-compose.yml`에 개발 전용 fallback 값이 있으나, 운영에서는 절대 사용 금지.

---

## 10. 디렉토리 구조

```
HYEnd_website/
├── frontend/          # 메인 사용자 웹앱 (React)
│   ├── src/{pages,components,services,store,hooks}
│   ├── nginx.conf     # API/WS 프록시 설정 (resolver 포함 — 아래 주의)
│   └── Dockerfile     # 멀티스테이지 (Node 빌드 → Nginx 서빙)
├── admin/             # 관리자 웹앱 (React)
│   ├── nginx.conf
│   └── Dockerfile
├── backend/           # Spring Boot API
│   ├── src/main/java/com/hyend/{controller,service,entity,repository,dto,security,config,exception}
│   ├── src/main/resources/{application.yml, application-dev.yml, application-prod.yml, db/migration/}
│   └── Dockerfile
├── docker-compose.yml       # 로컬 개발용
├── docker-compose.prod.yml  # 운영 배포용
├── .env.example
├── .github/workflows/ci.yml # CI/CD 파이프라인
└── docs/HANDOVER.md         # 이 문서
```

### ⚠️ nginx.conf 주의 (frontend/admin 공통)

- `location /api/`, `/ws/` 블록에 **`resolver 127.0.0.11 valid=10s;`** 와 변수 방식 `proxy_pass`(`set $backend ...; proxy_pass $backend$request_uri;`)가 들어있다.
- 이는 Docker 내장 DNS로 backend를 **런타임에** 해석하기 위함이다. 없으면 컨테이너 시작 시 `host not found in upstream "backend"` 오류로 프론트/어드민이 죽는다. **절대 삭제 금지.**
- (개선 여지: `resolver`에 `ipv6=off` 옵션 추가 시 더 안전 — Docker DNS는 ipv4라 ipv6 시도 시 실패 가능.)

---

## 11. 로컬 개발 환경

### 사전 준비

- Docker Desktop, Java 21+, Node.js 18+ (권장 IDE: IntelliJ IDEA)

### 전체 스택 실행 (Docker)

```bash
cp .env.example .env   # 최초 1회
docker compose up -d   # frontend/admin/backend/db/redis 한 번에
docker compose ps
docker compose down    # 종료
```

### 개별 실행 (IDE + 인프라만 Docker)

```bash
# DB, Redis만 Docker로
docker compose up -d db redis

# 백엔드 (backend 폴더에서)
./gradlew bootRun
# 포트가 다르면 오버라이드:
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:55432/hyend \
SPRING_DATA_REDIS_PORT=56379 \
./gradlew bootRun

# 프론트/어드민
cd frontend   # 또는 admin
npm install
npm run dev    # frontend 5173 / admin 5174
npm run build  # 프로덕션 빌드
```

> IntelliJ 팁: `BackendApplication.java`의 main 옆 녹색 버튼으로 실행/디버그. Settings → Build Tools → Gradle에서 "Build and run using"/"Run tests using"을 IntelliJ IDEA로 바꾸면 빌드가 빨라진다. 단, 로컬 실행 시 PostgreSQL/Redis가 켜져 있어야 한다(`docker compose up -d db redis`).

### 개발 환경 포트

| 서비스 | 포트 |
|--------|------|
| frontend (Docker) | 55173 / (로컬 dev) 5173 |
| admin | 5174 |
| backend | 8080 |
| PostgreSQL | 55432 (Docker) / 5432 (로컬) |
| Redis | 56379 (Docker) / 6379 (로컬) |

### 라이브러리 추가

- 프론트: 해당 디렉토리에서 `npm install <pkg>` (dev 의존성은 `-D`)
- 백엔드: `backend/build.gradle`의 `dependencies` 블록에 추가 후 Gradle 새로고침(또는 `./gradlew dependencies`)

### 테스트

```bash
# 백엔드 (Testcontainers가 PostgreSQL 자동 기동 — Docker 필요)
cd backend && ./gradlew test   # 리포트: build/reports/tests/test/index.html

# 프론트 타입 검사 + 단위 테스트
cd frontend && npx tsc --noEmit && npm run test

# E2E (Playwright)
cd frontend && npx playwright install && npm run test:e2e
```

---

## 12. 데이터베이스 관리 (Flyway 포함)

### Flyway 마이그레이션

DB 스키마는 Flyway로 버전 관리되며, 앱 기동 시 미적용분이 자동 실행된다.
위치: `backend/src/main/resources/db/migration/` (V1~V21 존재)

주요 마이그레이션: V1 users, V2 categories, V3 announcements, V4 events, V5 books, V6 inquiries, V7 attachments, V8 refresh_tokens, V9 seed_data(기본 카테고리+관리자 계정), V10 fix_admin_password, V11 posts, V12 book_rental 확장, V13 scraps, V14 meeting_rooms, V15 meeting_transcripts, V16 meeting_chat, V17 user_fcm_tokens, V18 drop refresh_tokens, V19 push_subscriptions로 교체, V20 meeting_minutes, V21 인덱스 추가.

> **규칙:** 새 변경은 반드시 `V22__...sql`, `V23__...sql` 형식으로 추가. **기존 파일 수정 절대 금지.**

### 접속

```bash
# 운영 서버 (컨테이너)
docker exec -it hyend_website-db-1 psql -U hyend_db_user -d hyend
# 또는
docker compose -f docker-compose.prod.yml exec db psql -U ${DB_USER} -d hyend

# 로컬 개발
psql -h localhost -p 55432 -U user -d hyend
```

### 백업 / 복원

```bash
# 백업 (정기 권장)
docker exec hyend_website-db-1 pg_dump -U hyend_db_user hyend > backup_$(date +%Y%m%d).sql

# 복원
cat backup.sql | docker exec -i hyend_website-db-1 psql -U hyend_db_user -d hyend
```

> **복원 시 주의:** backend가 이미 떠서 빈 테이블을 만들어 두면 `already exists`/`duplicate key` 충돌로 데이터가 안 들어간다. 그럴 땐 backend를 멈추고 스키마를 비운 뒤 복원한다:
> ```bash
> docker compose -f docker-compose.prod.yml stop backend
> docker exec -i hyend_website-db-1 psql -U hyend_db_user -d hyend -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
> cat backup.sql | docker exec -i hyend_website-db-1 psql -U hyend_db_user -d hyend
> docker compose -f docker-compose.prod.yml start backend
> ```
> 새 서버로 복원 시 PostgreSQL 버전을 원본과 맞출 것(현재 `postgres:16-alpine`). 버전 불일치는 복원 실패의 흔한 원인이다.

### Flyway 상태 확인

```bash
docker exec -it hyend_website-db-1 psql -U hyend_db_user -d hyend \
  -c "SELECT * FROM flyway_schema_history ORDER BY installed_rank;"
```

---

## 13. 외부 서비스 연동

### AWS S3 (파일 저장)

- 운영은 `FILE_STORAGE_TYPE=s3`. 버킷 `hyend-file-storage-126052242187`, 리전 `ap-northeast-2`.
- IAM 권한 필요: `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`.
- 허용 확장자: `jpg, jpeg, png, gif, pdf, docx, xlsx, pptx, hwp, zip`
- 제한: 요청당 최대 5개 파일, 파일당 10MB, 요청 전체 50MB

### LiveKit (화상 회의)

- 외부 LiveKit Cloud 사용 (자체 호스팅 아님). `LIVEKIT_API_KEY/SECRET/URL` 필요.

### OpenAI (회의록 AI)

- Whisper(whisper-1): 음성 → 텍스트. GPT(gpt-4o-mini): 회의록 요약.
- 할당량 (`application.yml`의 `ai.quota`): Whisper 일일 최대 3600초 / 회의당 10800초, GPT 월간 최대 100,000 토큰 / 회의당 호출 3회.

### Web Push (VAPID)

- Firebase 없이 브라우저 네이티브 Web Push.
- 키 생성: `npx web-push generate-vapid-keys` → Public/Private를 `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`에.
- **키를 바꾸면 기존 구독이 모두 무효화**되어 사용자가 재구독해야 하므로 변경하지 않는 것이 원칙.

---

## 14. 기본 관리자 계정 / 권한 체계

최초 배포 시 Flyway(V9, V10)로 관리자 계정이 자동 생성된다.

| 항목 | 값 |
|------|----|
| 이메일 | `admin@hyend.ac.kr` |
| 초기 비밀번호 | `Admin1234!` |
| 역할 | `ADMIN` |

> **⚠️ 최초 로그인 후 반드시 비밀번호를 변경할 것.** (비밀번호는 bcrypt 해시로 저장되어 원문 조회 불가)

### 권한 체계

| 역할 | 권한 |
|------|------|
| (비인증) | 공개 GET (공지, 이벤트, 도서 목록, 파일 다운로드) |
| `USER` | 게시판, 회의, 스크랩, 문의 등 |
| `STAFF` | 공지/이벤트/게시물 생성·수정 |
| `ADMIN` | 전체 관리 (삭제, 카테고리·사용자 관리) |

### 역할 변경 (어드민 API 예시)

```bash
curl -X PATCH http://16.184.60.186:8080/api/admin/users/{userId}/role \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role": "STAFF"}'
```

---

## 15. 주요 기능 현황

### 구현 완료

회원 가입/로그인(JWT, 액세스 15분/리프레시 7일), 공지사항(목록·상세·고정·카테고리·검색), 게시판(CRUD·스크랩), 파일 첨부(S3/로컬), 화상 회의(LiveKit), 회의 채팅(STOMP WebSocket), 회의록(음성→Whisper→GPT 요약), 도서 대출(대출 7일/연장 7일), 어드민 패널(사용자·역할 관리), 푸시 알림(Web Push).

### 미구현 (스텁 존재, DTO/엔티티 정의 완료 — 서비스 로직만 추가하면 됨)

- 이벤트 API 완성 — TODO [H-6]
- 카테고리 API 완성 — TODO [H-5]
- 문의 API 완성 — TODO [H-8]

---

## 16. 모니터링 및 헬스체크

```bash
# 헬스체크
curl http://16.184.60.186:8080/actuator/health   # {"status":"UP"}

# Prometheus 메트릭 (Grafana 연동 가능)
curl http://16.184.60.186:8080/actuator/prometheus

# 로그
docker compose -f docker-compose.prod.yml logs --tail=100
docker compose -f docker-compose.prod.yml logs -f backend
```

- Docker healthcheck가 `/actuator/health`를 사용. backend가 healthy여야 frontend/admin이 시작된다.
- 로그 레벨: prod `root=INFO, com.hyend=INFO` / dev `com.hyend=DEBUG`.

---

## 17. 트러블슈팅

| 증상 | 확인 / 해결 |
|---|---|
| **사이트가 안 열림** | 먼저 `curl -I http://localhost`로 서버 자체 확인. 서버는 되는데 브라우저만 안 되면 브라우저 http→https 자동전환 또는 네트워크 문제 |
| **SSH 무한 대기** | 보안 그룹 SSH 소스를 현재 IP로 갱신 (7번 참고) |
| **배포 실패(Actions 빨간 X)** | Actions 탭 → 해당 job 로그. deploy 실패면 SSH 키/헬스체크, test 실패면 코드 문제. `missing server host`면 `EC2_HOST` Secret 누락 |
| **프론트/어드민 컨테이너 `Exited`** | 로그에 `host not found in upstream "backend"`면 nginx.conf의 resolver 확인 (10번) |
| **https인데 로그인 등 기능 안 됨** | mixed content. Secrets의 `VITE_API_URL`이 `https://`인지, 프론트가 재빌드됐는지 확인 |
| **백엔드가 안 뜸** | 로그 확인. 흔한 원인: `SECRET_KEY` 미설정 / DB 연결 실패(db healthcheck) / Flyway 마이그레이션 오류 |
| **포트 충돌(`port is already allocated`)** | `lsof -i :8080` 등으로 점유 확인 → `docker rm -f <컨테이너명>` |
| **컨테이너가 자꾸 죽음** | `free -h`로 메모리 확인. 부족하면 스왑/인스턴스 사양 검토 |
| **Docker 무한 로딩(Mac)** | Docker Desktop VM 네트워크 마비. 고래 아이콘 → Restart/Quit 후 재시작 |
| **Flyway 실패** | flyway_schema_history 확인 후 수동 해결. `application.yml`의 `ignore-migration-patterns: "*:missing"`로 missing 무시 가능 |
| **파일 업로드 실패** | 크기(파일 10MB/요청 50MB)·확장자·S3 자격증명/버킷 권한 확인 |
| **DNS 반영 안 됨(도메인 이전 시)** | A레코드가 CNAME으로 잘못 들어갔는지 확인. `dig @ns1.hosting.co.kr hyend.kr A +short`로 네임서버 직접 조회 |

---

## 18. 보안 유의사항

1. **JWT `SECRET_KEY` 교체 시** 기존 토큰이 모두 무효화된다(전원 재로그인).
2. **AWS 키 유출 시** IAM에서 즉시 비활성화·삭제 후 새 키 발급. (git 히스토리에 남은 시크릿은 워킹트리 정리로 사라지지 않으므로 반드시 키 rotation)
3. **기본 관리자 비밀번호**(`Admin1234!`)는 배포 즉시 변경.
4. **DB/Redis 포트**는 프로덕션에서 외부 미노출 유지. EC2 보안 그룹에서 5432/6379 차단.
5. **API Rate Limiting** (Bucket4j + Caffeine) 적용 중.
6. **`.env`는 git 커밋 금지.** 서버에서는 `chmod 600 .env` 권장.
7. **SSH 소스 IP 제한** 유지 권장(전체 개방 `0.0.0.0/0`은 지양).

---

## 19. 남은 정리 작업 (TODO)

- [ ] **구 서버 정리:** 이전 AWS 계정의 기존 서버(`13.209.76.52`)가 아직 살아있을 수 있음. 새 서버 안정성 확인 후 stop → terminate, 해당 계정 Elastic IP도 release(안 하면 요금).
- [ ] **`.env`의 `VITE_API_URL` 중복 정리:** 서버 `.env`에 중복 줄 존재(현재 동작엔 지장 없음).
- [ ] **어드민/백엔드 도메인 연결:** admin(81)·backend(8080)는 아직 IP 포트 접근. `admin.hyend.kr` 등 서브도메인 + SSL 추가 고려.
- [ ] **정기 DB 백업 자동화:** 현재 수동. cron 등으로 자동화 권장.
- [ ] **메모리 모니터링:** 인스턴스 메모리가 여유롭지 않음. 트래픽 증가 시 사양 상향 검토(현재 스왑으로 버팀).
- [ ] **미구현 API 완성:** 이벤트/카테고리/문의 (15번 참고).

---

## 20. 부록: 서버 이전 이력

이 인프라는 기존 AWS 계정 서버(`13.209.76.52`)에서 **새 AWS 계정(`126052242187`)의 새 서버(`16.184.60.186`)로 통째 이전**하며 구축되었다. 수행 순서(재구축 시 참고):

1. 새 계정에 EC2(Ubuntu) 생성 + **Elastic IP(고정 IP) 부여** ← 도메인/SSL이 안 깨지려면 필수
2. 보안 그룹 인바운드: 22(내 IP), 80, 443, (81) 개방
3. Docker/Compose 준비, 코드 `git clone` (배포 브랜치 `master` 최신)
4. 기존 서버 DB `pg_dump` → 새 서버로 옮겨 복원 (스키마 초기화 후)
5. S3 버킷·IAM 키 신규 발급, `.env` 재구성 (JWT·키 신규 생성, 노출된 구 키는 비활성화)
6. `docker compose -f docker-compose.prod.yml up -d --build`
7. 호스트 nginx 리버스 프록시 설정(80/443 → 8081) + certbot으로 Let's Encrypt SSL 발급
8. 도메인(hyend.kr) DNS A레코드 → 새 IP, 전파 확인 후 certbot 실행
9. GitHub Secrets 재등록 + CI/CD 자동배포 연결

---

### 관련 문서

- `README.md` — 로컬 개발 상세
- `SECURITY.md` — 시크릿 관리 가이드
- `backend/API.md` — REST API 명세
- `docker-compose.prod.yml` — 프로덕션 Compose 정의
- `.github/workflows/ci.yml` — CI/CD 파이프라인 정의