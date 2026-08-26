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
| `DB_USER` / `DB_PASSWORD` | 운영 DB 계정 (docker-compose.prod.yml) |
| `FILE_STORAGE_TYPE` | `local` 또는 `s3`. 운영은 `s3` 권장 |
| `AWS_S3_BUCKET` / `AWS_S3_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 파일 저장 (`FILE_STORAGE_TYPE=s3` 일 때 필수) |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_URL` | 화상 회의 기능 (구현 완료) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push 푸시 알림 (Firebase 미사용, VAPID 방식) |
| `OPENAI_API_KEY` | Whisper 음성→텍스트, GPT 회의록 요약 |
| `APP_BASE_URL` | 서버 기본 URL (푸시 알림 링크 등에 사용) |

## JWT 시크릿 생성
```bash
openssl rand -base64 32
```
- 운영: `SECRET_KEY` 환경변수로만 주입한다. `application.yml`의 기본값은 `${JWT_SECRET}`(fallback 없음)이라 미설정 시 기동에 실패한다(fail-fast).
- 로컬(dev): `application-dev.yml`/`docker-compose.yml`에 **개발 전용** fallback 값이 있다. 운영에서는 절대 사용하지 말 것.

## VAPID 키 생성 (Web Push)
```bash
npx web-push generate-vapid-keys
# Public Key:  BG...  → VAPID_PUBLIC_KEY
# Private Key: ...    → VAPID_PRIVATE_KEY
```
한 번 생성한 키는 변경하지 않는 것이 원칙. 키를 바꾸면 기존 푸시 구독이 모두 무효화되어 사용자가 재구독해야 한다.

## GitHub Actions Secrets
CI/CD 자동 배포(`.github/workflows/ci.yml`)는 GitHub 저장소 Secrets에서 값을 읽는다. 저장소를 이전하거나 새 저장소에서 배포할 경우 아래 항목을 모두 재등록해야 한다.

> Settings → Secrets and variables → Actions → New repository secret

필요한 Secrets: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_WORKDIR`, `JWT_SECRET`, `DB_USER`, `DB_PASSWORD`, `AWS_S3_BUCKET`, `AWS_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `OPENAI_API_KEY`, `APP_BASE_URL`

## ⚠️ 유출 시 대응 (rotation)
과거 커밋에 실제 시크릿이 포함된 적이 있다면, 워킹트리를 정리해도 **git 히스토리에는 남는다**. 유효한 대응은 **키 교체(rotation)** 다.
- **JWT `SECRET_KEY`**: 새 값으로 교체 → 기존에 유출된 키로 서명된 토큰은 무효화된다(모든 사용자 재로그인 필요).
- **AWS 액세스 키**: IAM에서 해당 키를 **비활성화·삭제하고 새 키 발급**.
- 필요 시 `git filter-repo`/BFG로 히스토리에서 제거 후 강제 푸시(공유 히스토리 재작성 — 팀과 합의 필요).
