# HYEnd API 명세서

> Base URL: `/api`  
> 모든 응답은 `ApiResponse<T>` 형태로 래핑됩니다.  
> 인증이 필요한 엔드포인트는 `Authorization: Bearer <accessToken>` 헤더가 필요합니다.

---

## 공통 응답 형식

### ApiResponse\<T\>

```json
{
  "success": true,
  "message": "string | null",
  "data": "<T> | null"
}
```

### PageResponse\<T\>

```json
{
  "content": [],
  "page": 0,
  "size": 10,
  "totalElements": 100,
  "totalPages": 10,
  "first": true,
  "last": false
}
```

---

## 인증 API `/api/auth`

### POST `/api/auth/register` — 회원가입

**인증 불필요**

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "department": "컴퓨터소프트웨어학부",
  "studentId": "2024XXXXX"
}
```

| 필드 | 타입 | 제약 |
|------|------|------|
| email | String | 필수, 이메일 형식 |
| password | String | 필수, 최소 8자 |
| name | String | 필수 |
| department | String | 선택 |
| studentId | String | 선택 |

**Response** `ApiResponse<Void>`

---

### POST `/api/auth/login` — 로그인

**인증 불필요**

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** `ApiResponse<TokenResponse>`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
}
```

---

### POST `/api/auth/refresh` — 토큰 갱신

**인증 불필요**

**Request Body**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response** `ApiResponse<TokenResponse>` — 위 로그인 응답과 동일

---

### POST `/api/auth/logout` — 로그아웃

**인증 필요**

**Response** `ApiResponse<Void>`

---

## 공지사항 API `/api/announcements`

### GET `/api/announcements` — 공지사항 목록 조회

**인증 불필요**

**Query Parameters**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| categoryId | Long | (선택) 카테고리 ID 필터 |
| keyword | String | (선택) 검색 키워드 |
| page | int | 페이지 번호 (기본값: 0) |
| size | int | 페이지 크기 (기본값: 10) |
| sort | String | 정렬 기준 (기본값: createdAt,DESC) |

**Response** `ApiResponse<PageResponse<AnnouncementSummary>>`
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "title": "공지사항 제목",
        "createdAt": "2026-05-14T00:00:00",
        "updatedAt": "2026-05-14T00:00:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 100,
    "totalPages": 10,
    "first": true,
    "last": false
  }
}
```

---

### GET `/api/announcements/pinned` — 고정 공지사항 목록

**인증 불필요**

**Response** `ApiResponse<List<AnnouncementSummary>>`

---

### GET `/api/announcements/{id}` — 공지사항 상세 조회

**인증 불필요**

**Path Variables**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| id | Long | 공지사항 ID |

**Response** `ApiResponse<AnnouncementResponse>`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "공지사항 제목",
    "content": "공지사항 내용",
    "category": "일반",
    "writer": "관리자",
    "isImportant": false,
    "viewCount": 100,
    "createdAt": "2026-05-14T00:00:00",
    "updatedAt": "2026-05-14T00:00:00"
  }
}
```

---

### POST `/api/announcements` — 공지사항 생성

**인증 필요 — STAFF 또는 ADMIN**

**Request Body**
```json
{
  "title": "공지사항 제목",
  "content": "공지사항 내용",
  "category": "일반",
  "isImportant": false
}
```

| 필드 | 타입 | 제약 |
|------|------|------|
| title | String | 필수, 최대 100자 |
| content | String | 필수 |
| category | String | 필수 |
| isImportant | boolean | 필수 |

**Response** `ApiResponse<AnnouncementResponse>`

---

### PUT `/api/announcements/{id}` — 공지사항 수정

**인증 필요 — STAFF 또는 ADMIN**

**Path Variables**: `id` (Long)

**Request Body**: POST와 동일

**Response** `ApiResponse<AnnouncementResponse>`

---

### DELETE `/api/announcements/{id}` — 공지사항 삭제

**인증 필요 — ADMIN**

**Path Variables**: `id` (Long)

**Response** `ApiResponse<Void>`

---

### PUT `/api/announcements/{id}/pin` — 공지사항 고정

**인증 필요 — STAFF 또는 ADMIN**

**Path Variables**: `id` (Long)

**Response** `ApiResponse<Void>`

---

### PUT `/api/announcements/{id}/unpin` — 공지사항 고정 해제

**인증 필요 — STAFF 또는 ADMIN**

**Path Variables**: `id` (Long)

**Response** `ApiResponse<Void>`

---

## 파일 API `/api/files`

### POST `/api/files` — 파일 업로드

**인증 필요**

**Content-Type**: `multipart/form-data`

**Request**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| files | List\<MultipartFile\> | 업로드할 파일 목록 |

**Response** `201 Created` `ApiResponse<List<FileResponse>>`
```json
{
  "success": true,
  "data": [
    {
      "originalFilename": "document.pdf",
      "storedFilename": "uuid_document.pdf",
      "fileUrl": "/api/files/uuid_document.pdf",
      "fileSize": 102400,
      "contentType": "application/pdf"
    }
  ]
}
```

---

### GET `/api/files/{filename}` — 파일 다운로드

**인증 불필요**

**Path Variables**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| filename | String | 저장된 파일명 (경로 탐색 방지 패턴 적용) |

**Response** `ResponseEntity<Resource>` — 파일 바이너리 스트림

---

## 미구현 API (컨트롤러 Stub — DTO 정의 완료)

컨트롤러는 아직 stub이지만 요청/응답 DTO는 구현되어 있습니다.

### 도서 API `/api/books` — TODO [H-7]

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/books` | 공개 | 도서 목록 조회 |
| GET | `/api/books/{id}` | 공개 | 도서 상세 조회 |
| POST | `/api/books/{id}/rent` | 인증 필요 | 도서 대출 신청 |

**BookResponse**
```json
{
  "bookId": 1,
  "title": "책 제목",
  "author": "저자",
  "category": "분류",
  "summary": "요약",
  "imageUrl": "https://...",
  "isAvailable": true
}
```

**RentRequest**
```json
{
  "bookId": 1,
  "email": "user@example.com"
}
```

**RentalResponse**
```json
{
  "bookId": 1,
  "title": "책 제목",
  "author": "저자",
  "category": "분류",
  "isAvailable": false,
  "startDate": "2026-05-14T00:00:00",
  "endDate": "2026-05-28T00:00:00"
}
```

---

### 이벤트 API `/api/events` — TODO [H-6]

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/api/events` | 공개 |
| GET | `/api/events/{id}` | 공개 |
| POST | `/api/events` | STAFF/ADMIN |
| PUT | `/api/events/{id}` | STAFF/ADMIN |
| DELETE | `/api/events/{id}` | ADMIN |

**EventRequest**
```json
{
  "title": "행사 제목",
  "content": "행사 내용",
  "startDate": "2026-05-14T09:00:00",
  "endDate": "2026-05-14T18:00:00"
}
```

| 필드 | 타입 | 제약 |
|------|------|------|
| title | String | 필수 |
| content | String | 필수 |
| startDate | LocalDateTime | 선택 |
| endDate | LocalDateTime | 선택 |

**EventResponse**
```json
{
  "eventId": 1,
  "title": "행사 제목",
  "content": "행사 내용",
  "startDate": "2026-05-14T09:00:00",
  "endDate": "2026-05-14T18:00:00"
}
```

---

### 카테고리 API `/api/categories` — TODO [H-5]

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/api/categories` | 공개 |
| POST | `/api/categories` | ADMIN |
| PUT | `/api/categories/{id}` | ADMIN |
| DELETE | `/api/categories/{id}` | ADMIN |

**CategoryRequest**
```json
{
  "name": "카테고리명"
}
```

| 필드 | 타입 | 제약 |
|------|------|------|
| name | String | 필수, 최대 20자 |

**CategoryResponse**
```json
{
  "categoryId": 1,
  "name": "카테고리명"
}
```

---

### 문의 API `/api/inquiries` — TODO [H-8]

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/inquiries` | 문의 등록 |
| GET | `/api/inquiries/{id}` | 문의 상세 조회 |
| POST | `/api/inquiries/{id}/reply` | 답변 등록 |

---

## 권한 체계

| 역할 | 설명 |
|------|------|
| (비인증) | 공개 GET 엔드포인트 접근 가능 |
| USER | 로그인한 일반 사용자 |
| STAFF | 게시/수정 권한 (공지, 이벤트 등) |
| ADMIN | 전체 관리 권한 (삭제, 카테고리 관리 등) |

### 공개 엔드포인트 (인증 불필요)

- `POST /api/auth/**`
- `GET /api/announcements`, `GET /api/announcements/**`
- `GET /api/events`, `GET /api/events/**`
- `GET /api/categories`
- `GET /api/books`, `GET /api/books/**`
- `GET /api/files/**`
- Swagger UI: `/swagger-ui/**`, `/api-docs/**`
- Health check: `/actuator/health`

---

## 보안

- **인증 방식**: JWT Bearer Token (jjwt v0.12.6)
- **세션**: Stateless
- **CSRF**: 비활성화
- **비밀번호 암호화**: BCrypt
- **Rate Limiting**: Bucket4j (Caffeine 캐시 기반)
- **파일 다운로드**: 경로 탐색(Path Traversal) 방어 적용

---

## Swagger UI

개발 환경에서 `/swagger-ui/index.html` 접속 시 인터랙티브 API 문서 확인 가능합니다.
