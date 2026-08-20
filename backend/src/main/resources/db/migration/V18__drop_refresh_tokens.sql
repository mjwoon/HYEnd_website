-- refresh_tokens 테이블 제거 (미사용 스키마 정리)
--
-- 리프레시 토큰은 RefreshTokenRepository(Redis, RedisTemplate)로 저장·조회한다.
-- V8에서 생성된 이 테이블에 매핑되는 JPA 엔티티나 쿼리가 없어 한 번도 사용되지 않았다.
-- 테이블을 DROP하면 관련 인덱스(idx_refresh_tokens_user_id)와 제약
-- (uq_refresh_tokens_token, fk_refresh_tokens_user)도 함께 제거된다.
DROP TABLE IF EXISTS refresh_tokens;
