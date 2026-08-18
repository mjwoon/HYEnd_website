DROP TABLE IF EXISTS user_fcm_tokens;

CREATE TABLE push_subscriptions (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint    TEXT         NOT NULL,
    p256dh      TEXT         NOT NULL,
    auth        TEXT         NOT NULL,
    user_agent  VARCHAR(512),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
