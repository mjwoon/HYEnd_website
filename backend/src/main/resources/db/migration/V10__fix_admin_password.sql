-- Fix admin password hash (비밀번호: Admin1234!)
UPDATE users
SET password = '$2a$10$Bpd97T8x2JK0WL38nRxyiuUGaABxlrkzDjm.BIzSzF5Q45kEupUa2',
    updated_at = NOW()
WHERE email = 'admin@hyend.ac.kr'
  AND role = 'ADMIN';
