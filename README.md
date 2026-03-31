# HY-END Project Setup Guide

프로젝트 초기 스캐폴딩이 마무리된 후, 로컬 환경에서 프로젝트를 실행하고 관리하는 전체적인 가이드입니다.

---

## 1. Docker Compose로 전체 시스템 실행 🐳

`.env.example` 파일을 복사해 `.env` 파일을 로컬 환경 변수 저장 용도로 먼저 생성한 뒤 실행하는 것을 권장합니다.

```bash
# 환경 변수 템플릿 복사
cp .env.example .env

# 백그라운드에서 모든 컨테이너 시작 
# (Frontend, Admin, Backend, DB, Redis가 한 번에 실행됨)
docker compose up -d

# 실행 중인 컨테이너 상태 확인
docker compose ps

# 전체 시스템 종료 및 네트워크/컨테이너 정리
docker compose down
```

> **Note**: `docker compose up -d`를 실행하면 프론트엔드(55173), 어드민(5174), 백엔드(8080), PostgreSQL DB(55432), Redis(56379)가 포트를 통해 로컬망으로 한 번에 올라옵니다.

---

## 2. 개별 디렉토리별 빌드 및 실행 가이드 🚀

Docker 없이 IDE나 터미널에서 직접 개발 서버를 구동하는 방법입니다.

### A. Frontend 및 Admin (React + Vite)
```bash
# 1. 디렉토리 이동
cd frontend   # 또는 cd admin

# 2. 패키지 설치 (최초 1회 또는 패키지 변경 시)
npm install

# 3. 개발 서버 실행
# Frontend: http://localhost:5173
# Admin: http://localhost:5174
npm run dev

# 4. 프로덕션 빌드 (배포 목적)
npm run build
```

### B. Backend (Spring Boot 3 + Gradle)

터미널에서 자주 쓰이는 핵심 Gradle 명령어 모음입니다. (모든 명령어는 `backend` 폴더 내에서 실행해야 합니다.)

```bash
# 1. 기존 빌드 폴더(build/) 삭제 및 캐시 초기화 (오류 발생 시 유용)
./gradlew clean

# 2. 의존성 다운로드 및 애플리케이션 즉시 실행 (8080 포트)
./gradlew bootRun

# 3. 전체 단위/통합 테스트만 실행
./gradlew test

# 4. 테스트를 생략하고 운영 서버 배포용 JAR 파일만 아주 빠르게 빌드
./gradlew build -x test

# 5. 테스트를 포함하여 전체 검증 및 JAR 빌드 진행
./gradlew build

# 6. 현재 프로젝트에 설치된 모든 외부 라이브러리(의존성) 목록 트리 확인
./gradlew dependencies
```

> **🔥 IntelliJ IDEA 사용자 개발 꿀팁 (강력 추천)**
> IntelliJ를 주력으로 사용하신다면 매번 터미널에 위 명령어를 치실 필요가 없습니다!
> 
> 1. **앱 실행 & 디버그:** `src/main/java/.../BackendApplication.java` 파일의 `main` 메서드 옆에 있는 **녹색 재생 버튼(Run/Debug)**을 누르는 것이 가장 빠르고, 브레이크포인트를 활용한 디버깅이 가능합니다. (`Shift + F10` 단축키)
> 2. **빌드 속도 최적화:** `Settings(Preferences)` > `Build, Execution, Deployment` > `Build Tools` > `Gradle` 로 이동하여 **"Build and run using"** 과 **"Run tests using"** 설정을 둘 다 `Gradle`에서 **`IntelliJ IDEA`**로 변경하시면, 빌드 및 서버 재시작 속도가 체감될 정도로 훨씬 빨라집니다.

> **Important**: IntelliJ에서 백엔드를 단독으로 띄우려면, 로컬 환경(127.0.0.1)에 PostgreSQL과 Redis 전원이 들어와 있어야 합니다. 
> 백그라운드 터미널에 `docker compose up -d db redis` 명렁어로 데이터베이스만 미리 켜둔 상태에서, IntelliJ의 녹색 버튼을 눌러 로컬(dev) 서버를 띄우는 것이 정석적인 개발 방식입니다.

---

## 3. 새로운 라이브러리 및 확장 기능(Extension) 설치 방법 📦

### A. Frontend / Admin (Node.js 생태계)
새로운 NPM 패키지가 필요할 때, 해당 디렉토리(`frontend` 또는 `admin`)로 이동 후 터미널에 입력합니다.

- **일반 라이브러리 추가 (예: 차트 라이브러리)**
  ```bash
  npm install chart.js react-chartjs-2
  ```
- **개발용(Dev) 의존성 추가 (예: 코드 포매터나 타입 정의)**
  ```bash
  npm install -D @types/chart.js prettier
  ```
  설치 시 자동으로 `package.json`과 `package-lock.json`에 내용이 반영됩니다.

### B. Backend (Spring Boot/Java 생태계)
백엔드에 새로운 라이브러리나 Spring Boot Starter 의존성을 추가하려면 `backend/build.gradle` 파일을 수정해야 합니다.

1. `backend/build.gradle` 파일의 `dependencies { ... }` 블록 안에 라이브러리를 추가합니다.
   ```groovy
   dependencies {
       // 예시: AWS S3 라이브러리 추가
       implementation 'software.amazon.awssdk:s3:2.29.0'
       
       // 예시: 개발용 라이브러리 추가
       testImplementation 'org.mockito:mockito-core:5.0.0'
   }
   ```
2. 변경 사항을 적용합니다. 
   - **IntelliJ 등 IDE**: `build.gradle` 수정 후 나타나는 코끼리 모양의 **'Load Gradle Changes'** 새로고침 버튼을 누르면 자동 반영됩니다.
   - **터미널**: 아래 명령어를 통해 강제로 의존성을 동기화할 수 있습니다.
     ```bash
     ./gradlew dependencies
     ```

---

## 4. 자주 발생하는 오류 및 해결 가이드 (Troubleshooting) 🛠️

### A. 포트 충돌 에러 (`Bind for 0.0.0.0:xxx failed: port is already allocated`)
이미 다른 프로젝트(또는 데몬)가 해당 포트를 점유하고 있어 발생하는 에러입니다.
- **주요 대상:** 8080(백엔드), 55173(Docker 프론트엔드), 5173(로컬 프론트엔드 dev 서버), 55432(Docker PostgreSQL), 56379(Docker Redis)
- **해결책:** 점유 중인 기존 컨테이너를 강제로 종료/삭제하여 포트를 비워주세요.
  ```bash
  # 예: fastapi_backend 라는 이름의 기존 컨테이너 삭제
  docker rm -f fastapi_backend

  # 점유 중인 프로세스 조회 (Mac)
  lsof -i :8080
  ```

### B. 로컬 백엔드 실행 시 DB/Redis 접속 실패 (`Connection to localhost:5432 refused` 등)
터미널에서 `./gradlew bootRun`을 실행할 때, DB 또는 Redis 접속이 안된다는 에러입니다.
- **원인:** `docker compose down`으로 인프라(DB, Redis)까지 꺼졌거나, Docker 호스트 포트(55432/56379)와 로컬 기본 포트(5432/6379)가 달라졌기 때문입니다.
- **해결책:** 백엔드만 로컬에서 돌리더라도, 데이터베이스/Redis는 Docker에서 켜져 있어야 합니다. 먼저 인프라를 켠 뒤, 필요하면 포트를 환경 변수로 맞춰 실행합니다.
  ```bash
  docker compose up -d db redis

  SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:55432/hyend \
  SPRING_DATA_REDIS_PORT=56379 \
  ./gradlew bootRun
  ```
  이후 다시 `./gradlew bootRun`을 실행하면 정상 동작합니다.

### C. 도커 터미널 무한 로딩 / 멈춤 현상 (3분 이상 응답 없음)
`docker compose up` 또는 `./gradlew bootRun`과 같은 터미널 명령어를 입력했는데 3~5분이 지나도 돌아가지 않고 커서만 깜빡이거나 멈춰있는 현상입니다.
- **원인:** 맥북 특성상 잦은 컨테이너 생성/종료 반복 시 Docker Desktop의 내부 가상머신(VM) 네트워크가 마비(Deadlock)되는 현상입니다.
- **해결책:** 명령어로는 풀 수 없습니다.
  1. 맥북 우측 상단 메뉴바의 **고래 아이콘(Docker)** 클릭
  2. `Restart` 혹은 `Quit Docker Desktop` 으로 앱 완전 재시작
  3. 초록불(`Running`)로 완전히 켜진 후 새로운 터미널을 열어 명령어 재입력
