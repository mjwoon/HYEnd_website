CREATE TABLE meeting_chat_messages (
    id          BIGSERIAL PRIMARY KEY,
    room_id     BIGINT       NOT NULL REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    type        VARCHAR(16)  NOT NULL DEFAULT 'TEXT',
    content     TEXT,
    file_url    TEXT,
    file_name   VARCHAR(255),
    file_size   BIGINT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
