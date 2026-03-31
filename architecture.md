# HY-END 시스템 아키텍처 설계서

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Frontend | React + TypeScript + Vite |
| Backend | SpringBoot |
| Database | PostgreSQL + Redis |
| 컨테이너 | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| 테스트 | JUnit 5 + Mockito (백엔드), Vitest + Playwright (프론트엔드) |
| 파일 저장 | AWS S3 / 로컬 볼륨 |
| API 문서 | Springdoc OpenAPI (Swagger UI) |
| DB 마이그레이션 | Flyway |
| 로깅 | SLF4J + Logback |
| 모니터링 | Spring Boot Actuator |

---

## 전체 시스템 구조

```
┌─────────────────────────┐    ┌─────────────────────────┐
│  Frontend               │    │  Admin Panel            │
│  React + TS + Vite      │    │  React + TS + Vite      │
│  (host: 55173 -> 5173)  │    │  (host: 5174 -> 5174)  │
└─────────────────────────┘    └─────────────────────────┘
           │                              │
           │ HTTPS / REST API             │
           ▼                              ▼
┌──────────────────────────────────────────────────────┐
│                   API Gateway                        │
│             Spring Boot Server (port: 8080)          │
├──────────────────────────────────────────────────────┤
│               Authentication Layer                   │
│                 JWT + RBAC                           │
├──────────────────────────────────────────────────────┤
│               Business Logic Layer                   │
│              Services + Controllers                  │
├──────────────────────────────────────────────────────┤
│               Data Access Layer                      │
│            Repository Pattern (Spring Data JPA)      │
└──────────────────────────────────────────────────────┘
           │                     │                │
           ▼                     ▼                ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   PostgreSQL    │   │     Redis       │   │   AWS S3        │
│ (host: 55432 -> 5432) │ │ (host: 56379 -> 6379) │ │ (외부 서비스) │
└─────────────────┘   └─────────────────┘   └─────────────────┘
                                                    │
                                              ┌─────┴─────┐
                                              │ 개발: 로컬  │
                                              │ 운영: S3   │
                                              └───────────┘
```

---

## Docker Compose 구성

```yaml
# docker-compose.yml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "55173:5173"
    environment:
      - VITE_API_URL=http://backend:8080
    depends_on:
      backend:
        condition: service_healthy
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - frontend-net
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  admin:
    build:
      context: ./admin
      dockerfile: Dockerfile
    ports:
      - "5174:5174"
    environment:
      - VITE_API_URL=http://backend:8080
    depends_on:
      backend:
        condition: service_healthy
    volumes:
      - ./admin:/app
      - /app/node_modules
    networks:
      - frontend-net
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/hyend
      - SPRING_DATASOURCE_USERNAME=user
      - SPRING_DATASOURCE_PASSWORD=password
      - SPRING_DATA_REDIS_HOST=redis
      - SPRING_DATA_REDIS_PORT=6379
      - SPRING_PROFILES_ACTIVE=dev
      - JWT_SECRET=${SECRET_KEY}
      - JAVA_OPTS=-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC
      - AWS_S3_BUCKET=${AWS_S3_BUCKET}
      - AWS_S3_REGION=${AWS_S3_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - FILE_STORAGE_TYPE=local               # local | s3
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    volumes:
      - upload_data:/app/uploads
    networks:
      - frontend-net
      - backend-net
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=hyend
    ports:
      - "55432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d hyend"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - backend-net
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  redis:
    image: redis:7-alpine
    ports:
      - "56379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend-net
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'

  test:
    build:
      context: ./backend
      dockerfile: Dockerfile.test
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/hyend_test
      - SPRING_DATASOURCE_USERNAME=user
      - SPRING_DATASOURCE_PASSWORD=password
      - SPRING_PROFILES_ACTIVE=test
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: ["./gradlew", "test", "--info"]
    networks:
      - backend-net
    profiles:
      - test

volumes:
  postgres_data:
  redis_data:
  upload_data:

networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge
```

**네트워크 구조**

```
┌──────────────────────────────────────────────┐
│              frontend-net                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Frontend │ │  Admin   │ │   Backend    │ │
│  │:5173(c) │ │:5174(c)  │ │  :8080(c)    │ │
│  └──────────┘ └──────────┘ └──────┬───────┘ │
└───────────────────────────────────┼─────────┘
                                    │
┌───────────────────────────────────┼─────────┐
│              backend-net          │         │
│  ┌──────────────┐ ┌──────────┐ ┌─┴────────┐ │
│  │  PostgreSQL  │ │  Redis   │ │ Backend  │ │
│  │ :5432(c)     │ │:6379(c) │ │ :8080(c) │ │
│  └──────────────┘ └──────────┘ └──────────┘ │
└──────────────────────────────────────────────┘
```

> Frontend/Admin은 Backend에만 접근 가능하고, DB/Redis에 직접 접근할 수 없습니다.

> `docker-compose.yml`의 외부 노출(host) 포트는 Frontend `55173`, PostgreSQL `55432`, Redis `56379`이며, 컨테이너 내부 포트는 각각 `5173`, `5432`, `6379`를 사용합니다.

---

## Dockerfile (Spring Boot Multi-Stage Build)

```dockerfile
# backend/Dockerfile

# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY gradle/ gradle/
COPY gradlew build.gradle settings.gradle ./
RUN ./gradlew dependencies --no-daemon
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=builder /app/build/libs/*.jar app.jar
USER spring:spring
EXPOSE 8080
ENTRYPOINT ["java", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:+UseG1GC", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
```

> **Multi-Stage Build**: 빌드 이미지(JDK ~400MB)와 런타임 이미지(JRE ~180MB)를 분리하여 최종 이미지 크기를 최소화합니다. 비root 사용자(`spring`)로 실행하여 보안을 강화합니다.

---

## 프론트엔드 구조 (React + TypeScript + Vite)

```
frontend/
├── src/
│   ├── assets/
│   ├── components/        # 공통 컴포넌트
│   ├── features/          # 도메인별 기능 모듈
│   │   ├── auth/
│   │   ├── announcement/
│   │   ├── calendar/
│   │   ├── board/
│   │   └── book/
│   ├── hooks/             # 커스텀 훅
│   ├── pages/             # 라우트별 페이지
│   ├── router/            # React Router 설정
│   ├── services/          # API 클라이언트 (axios)
│   ├── store/             # 전역 상태 (Zustand or Jotai)
│   ├── types/             # TypeScript 타입 정의
│   └── utils/
├── public/
├── vite.config.ts
├── tsconfig.json
└── Dockerfile
```

**주요 라이브러리**

- React Router v6 — 클라이언트 사이드 라우팅
- Axios — API 통신
- Zustand — 전역 상태 관리
- React Query (TanStack Query) — 서버 상태 관리
- Vitest — 유닛 테스트
- Playwright — E2E 테스트

---

## 백엔드 구조 (Spring Boot + Gradle)

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/hyend/
│   │   │   ├── controller/
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── AnnouncementController.java
│   │   │   │   ├── EventController.java
│   │   │   │   ├── BookController.java
│   │   │   │   ├── InquiryController.java
│   │   │   │   └── FileController.java
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java     # Spring Security 설정
│   │   │   │   ├── RedisConfig.java        # Redis 설정
│   │   │   │   ├── S3Config.java           # AWS S3 클라이언트 설정
│   │   │   │   └── WebConfig.java          # CORS 등 웹 설정
│   │   │   ├── security/
│   │   │   │   ├── JwtTokenProvider.java   # JWT 토큰 생성/검증
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── CustomUserDetailsService.java
│   │   │   ├── entity/                     # JPA 엔티티
│   │   │   ├── dto/                        # 요청/응답 DTO
│   │   │   ├── service/                    # 비즈니스 로직
│   │   │   ├── repository/                 # Spring Data JPA Repository
│   │   │   ├── mapper/                     # MapStruct Entity ↔ DTO 매퍼
│   │   │   ├── common/                     # 공통 응답, 상수, 유틸리티
│   │   │   ├── exception/                  # 커스텀 예외 및 핸들러
│   │   │   └── HyendApplication.java
│   │   └── resources/
│   │       ├── application.yml             # 메인 설정
│   │       ├── application-dev.yml         # 개발 환경 설정
│   │       └── application-prod.yml        # 운영 환경 설정
│   └── test/
│       └── java/com/hyend/
│           ├── controller/                 # Controller 단위 테스트
│           ├── service/                    # Service 단위 테스트
│           ├── repository/                 # Repository 통합 테스트
│           └── integration/                # API 통합 테스트
├── build.gradle                            # Gradle 빌드 설정
├── settings.gradle
└── Dockerfile
```

**주요 의존성 (build.gradle)**

```groovy
dependencies {
    // Web & Core
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    implementation 'org.springframework.boot:spring-boot-starter-mail'

    // Security & JWT
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.6'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.6'

    // Database & Cache
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    runtimeOnly 'org.postgresql:postgresql'
    implementation 'org.flywaydb:flyway-core'
    runtimeOnly 'org.flywaydb:flyway-database-postgresql'

    // API Documentation
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.0'

    // File Storage (AWS S3)
    implementation 'software.amazon.awssdk:s3:2.29.0'

    // Object Mapping
    implementation 'org.mapstruct:mapstruct:1.6.3'
    annotationProcessor 'org.mapstruct:mapstruct-processor:1.6.3'

    // Rate Limiting
    implementation 'com.bucket4j:bucket4j-core:8.14.0'

    // Lombok
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

    // Test
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
    testImplementation 'com.h2database:h2'
}
```

**Gradle 사용 예시**

```bash
./gradlew bootRun              # 서버 실행 (개발 모드)
./gradlew test                 # 테스트 실행
./gradlew build                # 빌드 (JAR 생성)
./gradlew bootJar              # 실행 가능 JAR 생성
```

**application.yml 설정 예시**

```yaml
# application.yml (공통)
spring:
  application:
    name: hyend
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
    properties:
      hibernate:
        format_sql: true
  flyway:
    enabled: true
    locations: classpath:db/migration
  servlet:
    multipart:
      enabled: true
      max-file-size: 10MB
      max-request-size: 50MB

server:
  port: 8080

# 파일 저장소 설정
file:
  storage:
    type: ${FILE_STORAGE_TYPE:local}      # local | s3
    local:
      upload-dir: ./uploads
    s3:
      bucket: ${AWS_S3_BUCKET:}
      region: ${AWS_S3_REGION:ap-northeast-2}
  allowed-extensions: jpg,jpeg,png,gif,pdf,docx,xlsx,pptx,hwp,zip
  max-file-count: 5                       # 요청당 최대 파일 수

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui

logging:
  level:
    root: INFO
    com.hyend: DEBUG
    org.springframework.security: DEBUG
```

```yaml
# application-dev.yml (개발 환경)
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/hyend
    username: user
    password: password
  data:
    redis:
      host: localhost
      port: 6379
  jpa:
    show-sql: true

logging:
  level:
    root: DEBUG
```

---

## CI/CD 파이프라인 (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: user
          POSTGRES_PASSWORD: password
          POSTGRES_DB: hyend_test
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      - uses: gradle/actions/setup-gradle@v4
      - run: ./gradlew test jacocoTestReport
        working-directory: ./backend
      - uses: codecov/codecov-action@v4
        with:
          files: ./backend/build/reports/jacoco/test/jacocoTestReport.xml

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: ./frontend
      - run: npm run test
        working-directory: ./frontend
      - run: npm run build
        working-directory: ./frontend

  e2e-test:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    steps:
      - uses: actions/checkout@v4
      - run: docker compose up -d
      - run: npm run test:e2e
        working-directory: ./frontend

  deploy:
    runs-on: ubuntu-latest
    needs: [e2e-test]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: docker compose -f docker-compose.prod.yml up -d --build
```

---

## 데이터베이스 스키마

**1. users**

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(20),
    department VARCHAR(100),
    role VARCHAR(20) DEFAULT 'student',  -- student | staff | admin
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**2. announcements**

```sql
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    priority VARCHAR(10) DEFAULT 'normal',
    status VARCHAR(10) DEFAULT 'draft',
    is_pinned BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    published_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**3. events**

```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    location VARCHAR(200),
    requires_rsvp BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**4. books / book_rentals**

```sql
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100),
    total_quantity INTEGER DEFAULT 1,
    available_quantity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE book_rentals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    book_id INTEGER REFERENCES books(id),
    rental_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(10) DEFAULT 'pending',  -- pending | approved | rented | returned | overdue
    approved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**5. categories**

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**6. attachments**

```sql
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    entity_type VARCHAR(50) NOT NULL,       -- announcement | inquiry | event
    entity_id INTEGER NOT NULL,
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);
```

**7. inquiries**

```sql
CREATE TABLE inquiries (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'open',      -- open | in_progress | resolved | closed
    is_private BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inquiry_replies (
    id SERIAL PRIMARY KEY,
    inquiry_id INTEGER REFERENCES inquiries(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**8. refresh_tokens**

```sql
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

---

## 보안 설계

- **인증**: JWT Access Token (15분) + Refresh Token (7일)
- **권한**: RBAC — student / staff / admin
- **비밀번호**: bcrypt 해싱
- **통신**: HTTPS 강제
- **입력검증**: Jakarta Validation (Bean Validation), Spring Data JPA (SQL Injection 방지)
- **XSS 방지**: 입력값 sanitization
- **Rate Limiting**: Bucket4j — API 남용 방지 (인증 API: 5회/분, 일반 API: 100회/분)
- **파일 업로드 보안**:
  - 허용 확장자 화이트리스트 (jpg, png, pdf, docx 등)
  - MIME 타입 검증 (Content-Type 헤더 + 매직 바이트 확인)
  - 파일 크기 제한 (단일 10MB, 요청 총 50MB)
  - 저장 파일명 UUID 변환 (경로 탐색 공격 방지)
  - Antivirus 스캐닝 연동 가능 (ClamAV 등)

---

## 성능 최적화

- **캐싱**: Redis — 공지사항 목록 5분, 카테고리 1시간
- **페이지네이션**: 모든 목록 API 기본 적용
- **인덱스**: 자주 조회되는 컬럼 (email, student_id, announcement category_id 등)
- **목표**: 동시 500명, 응답 3초 이내, 가용성 99%
- **모니터링**: Spring Boot Actuator — 헬스체크(`/actuator/health`), 메트릭스(`/actuator/metrics`)

---

## 로깅 전략

- **프레임워크**: SLF4J + Logback (Spring Boot 기본 내장)
- **로그 레벨**: 환경별 프로파일 분리 (dev: DEBUG, prod: INFO)
- **로그 포맷**: 타임스탬프, 로그레벨, 스레드명, 클래스명, 메시지
- **주요 로깅 대상**:
  - API 요청/응답 (Filter 레벨)
  - 인증 실패/성공
  - 비즈니스 예외 발생
  - DB 쿼리 (개발 환경에서만 `show-sql: true`)
- **운영 환경**: JSON 포맷 출력, 외부 로그 수집 도구 연동 가능 (ELK, CloudWatch 등)

---

## API 문서화

- **도구**: Springdoc OpenAPI (Swagger UI)
- **접근 경로**: `/swagger-ui` (개발 환경), 운영 환경에서는 비활성화
- **주요 설정**:
  - API 그룹별 분류 (Auth, Announcement, Event, Book, Inquiry)
  - JWT Bearer 인증 스키마 자동 적용
  - 요청/응답 DTO 기반 자동 스키마 생성

---

## 파일 저장소 전략

### 저장 방식

| 환경 | 저장소 | 설명 |
|---|---|---|
| 개발 (dev) | 로컬 파일시스템 | `./uploads/` 디렉토리, Docker 볼륨 바인드 |
| 운영 (prod) | AWS S3 | S3 버킷 + CloudFront CDN 연동 가능 |

### 파일 저장 흐름

```
Client → FileController → FileService → StorageStrategy (Interface)
                                              │
                                    ┌─────────┴─────────┐
                                    │                    │
                              LocalStorage          S3Storage
                            (개발 환경)            (운영 환경)
```

> **Strategy 패턴**: `FILE_STORAGE_TYPE` 환경변수에 따라 `LocalStorageService` 또는 `S3StorageService`가 자동 주입됩니다.

### 파일 업로드 API 명세

```
POST   /api/v1/files/upload          # 파일 업로드 (multipart/form-data)
GET    /api/v1/files/{id}/download    # 파일 다운로드
DELETE /api/v1/files/{id}             # 파일 삭제
GET    /api/v1/files/{id}/presigned   # S3 Presigned URL 발급 (운영 환경)
```

### 파일 저장 규칙

- **저장 경로**: `/{entity_type}/{yyyy}/{MM}/{uuid}.{ext}` (예: `/announcement/2026/03/a1b2c3d4.pdf`)
- **원본 파일명**: DB `attachments` 테이블의 `original_name`에 보존
- **중복 방지**: UUID 기반 파일명 자동 생성
- **고아 파일 정리**: 스케줄러로 DB에 없는 고아 파일 주기적 삭제 (매일 02:00)