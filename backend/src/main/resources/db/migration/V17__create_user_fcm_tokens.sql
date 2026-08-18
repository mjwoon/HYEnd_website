CREATE TABLE user_fcm_tokens (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token        TEXT         NOT NULL UNIQUE,
    user_agent   VARCHAR(255),
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
