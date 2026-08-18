# 시크릿 관리 가이드

## 원칙
- **실제 시크릿은 저장소에 커밋하지 않는다.** 모든 시크릿은 `.env`(로컬)와 배포 환경의 환경변수로만 주입한다.
- `.env`는 `.gitignore`로 추적 제외되어 있다. `.env.example`에는 **플레이스홀더만** 둔다.
- 테스트 코드에는 실제 시크릿 대신 명백한 테스트 전용 값을 사용한다(`application-test.yml`, `JwtTokenProviderTest`).

## 필요한 환경변수
`.env.example`를 복사해 `.env`를 만들고 값을 채운다.

| 변수 | 용도 |
|---|---|
| `SECRET_KEY` (=`JWT_SECRET`) | JWT 서명 키. Base64, 256-bit 이상 |
| `AWS_S3_BUCKET` / `AWS_S3_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 파일 저장(prod, `FILE_STORAGE_TYPE=s3`) |
| `DB_USER` / `DB_PASSWORD` | 운영 DB 계정 (docker-compose.prod.yml) |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_SERVER_URL` | (미완성 회의 기능) |
| `OPENAI_API_KEY`, `FIREBASE_CREDENTIALS_PATH` | (미구현 기능) |

## JWT 시크릿 생성
```bash
openssl rand -base64 32
```
- 운영: `SECRET_KEY` 환경변수로만 주입한다. `application.yml`의 기본값은 `${JWT_SECRET}`(fallback 없음)이라 미설정 시 기동에 실패한다(fail-fast).
- 로컬(dev): `application-dev.yml`/`docker-compose.yml`에 **개발 전용** fallback 값이 있다. 운영에서는 절대 사용하지 말 것.

## ⚠️ 유출 시 대응 (rotation)
과거 커밋에 실제 시크릿이 포함된 적이 있다면, 워킹트리를 정리해도 **git 히스토리에는 남는다**. 유효한 대응은 **키 교체(rotation)** 다.
- **JWT `SECRET_KEY`**: 새 값으로 교체 → 기존에 유출된 키로 서명된 토큰은 무효화된다(모든 사용자 재로그인 필요).
- **AWS 액세스 키**: IAM에서 해당 키를 **비활성화·삭제하고 새 키 발급**.
- 필요 시 `git filter-repo`/BFG로 히스토리에서 제거 후 강제 푸시(공유 히스토리 재작성 — 팀과 합의 필요).
