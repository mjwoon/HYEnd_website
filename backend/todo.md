# HYEnd 백엔드 구현 TODO

> 진행 상태: ⬜ 미시작 / 🔄 진행중 / ✅ 완료

---

## 리더 — 아키텍처 & 핵심 로직 담당

> **역할:** 설계 결정, 보안/인증, 복잡한 비즈니스 로직, 코드 리뷰
> **시작 조건:** 즉시 시작 가능

### Day 4 — 테스트 & 코드 리뷰
- [ ] **L-12** Auth 테스트 작성 (테스트 패턴 정립)
  - [ ] `test/resources/application-test.yml`
  - [ ] `test/.../service/AuthServiceTest.java`
  - [ ] `test/.../controller/AuthControllerTest.java`
- [ ] **L-13** 보조 작업물 코드 리뷰 및 피드백
- [ ] **L-14** 통합 테스트
  - [ ] `test/.../repository/UserRepositoryTest.java`
  - [ ] `test/.../repository/AnnouncementRepositoryTest.java`

---

## 보조 — 도메인 구현 & 반복 작업 담당

> **역할:** 리더가 설계한 패턴을 따라 도메인별 구현, SQL 마이그레이션, DTO/Mapper 작성
> **시작 조건:** DTO(H-1, H-2)는 즉시 시작. H-3 이후는 **리더의 entity/repository 완료 후** 시작

### Day 1 (리더와 병렬)
- [ ] **H-1** 전체 DTO 클래스 작성
  - [ ] `dto/auth/` — LoginRequest, RegisterRequest, TokenResponse, RefreshRequest
  - [ ] `dto/announcement/` — AnnouncementRequest, AnnouncementResponse, AnnouncementSummary
  - [ ] `dto/event/` — EventRequest, EventResponse
  - [ ] `dto/book/` — BookResponse, RentRequest, RentalResponse
  - [ ] `dto/inquiry/` — InquiryRequest, InquiryResponse, ReplyRequest, ReplyResponse
  - [ ] `dto/category/` — CategoryRequest, CategoryResponse
  - [ ] `dto/file/` — FileResponse

### Day 2 (리더와 병렬)
- [ ] **H-3** MapStruct Mapper 구현 (리더의 entity 완료 후)
  - [ ] `mapper/AnnouncementMapper.java`
  - [ ] `mapper/EventMapper.java`
  - [ ] `mapper/BookMapper.java`
  - [ ] `mapper/InquiryMapper.java`
  - [ ] `mapper/UserMapper.java`
- [ ] **H-4** 설정 파일 구현 (리더의 설계 기반)
  - [ ] `config/WebConfig.java` (CORS: 55173, 5174, 5173)
  - [ ] `config/S3Config.java`
  - [ ] `config/FileStorageConfig.java`

### Day 3 (리더의 repository 완료 후)
- [ ] **H-5** 카테고리 서비스 + 컨트롤러 (Redis 캐싱 포함)
  - [ ] `service/CategoryService.java`
  - [ ] `controller/CategoryController.java`
- [ ] **H-6** 행사 서비스 + 컨트롤러
  - [ ] `service/EventService.java`
  - [ ] `controller/EventController.java`
- [ ] **H-7** 도서 서비스 + 컨트롤러 (대출/반납/재고 로직)
  - [ ] `service/BookService.java`
  - [ ] `controller/BookController.java`
- [ ] **H-8** 문의 서비스 + 컨트롤러
  - [ ] `service/InquiryService.java`
  - [ ] `controller/InquiryController.java`

### Day 4 (리더 리뷰 반영)
- [ ] **H-9** 도메인 서비스 테스트 (리더의 Auth 테스트 패턴 참고)
  - [ ] `test/.../service/AnnouncementServiceTest.java`
  - [ ] `test/.../service/BookServiceTest.java`
  - [ ] `test/.../repository/BookRentalRepositoryTest.java`
- [ ] **H-10** 리더 피드백 반영 및 수정

---

## Day 5 — 전체 통합 검증 (공동)

- [ ] `docker compose up -d db redis` → 인프라 기동
- [ ] `./gradlew bootRun` → Flyway 마이그레이션 자동 실행 확인
- [ ] `http://localhost:8080/swagger-ui` → 전체 API 문서 확인
- [ ] 시나리오 테스트:
  - [ ] POST /api/auth/register → 회원가입
  - [ ] POST /api/auth/login → JWT 발급 확인
  - [ ] GET /api/announcements → 비인증 접근 가능
  - [ ] POST /api/announcements (STUDENT 토큰) → 403 확인
  - [ ] POST /api/announcements (STAFF 토큰) → 201 확인
- [ ] `./gradlew test` → 전체 테스트 통과
- [ ] `docker compose up -d` → 전체 스택 헬스체크 통과
