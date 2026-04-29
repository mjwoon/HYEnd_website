-- 기본 카테고리
INSERT INTO categories (name, description, created_at, updated_at) VALUES
    ('공지사항', '일반 공지사항',   NOW(), NOW()),
    ('학사',     '학사 관련 공지',   NOW(), NOW()),
    ('장학금',   '장학금 관련 공지', NOW(), NOW()),
    ('취업',     '취업 관련 공지',   NOW(), NOW()),
    ('행사',     '행사 및 이벤트',   NOW(), NOW());

-- 기본 관리자 계정 (비밀번호: Admin1234!)
-- bcrypt 해시: $2a$10$fVH8e28OQRj9tqiDXs1e4u9b2b7b7b7b7b7b7b7b7b7b7b7b7b7bO
-- ※ 운영 배포 전 반드시 비밀번호를 변경하세요.
INSERT INTO users (email, password, name, role, is_active, created_at, updated_at) VALUES
    ('admin@hyend.ac.kr',
     '$2a$10$7EqJtq98hPqEX7fNZaFWoOa4LvB6EzfLMBr0W9LhNdA9ZHJX0BVC2',
     '관리자',
     'ADMIN',
     TRUE,
     NOW(),
     NOW());
