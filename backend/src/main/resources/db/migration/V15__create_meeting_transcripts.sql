CREATE TABLE meeting_transcripts (
    id              BIGSERIAL PRIMARY KEY,
    room_id         BIGINT    NOT NULL REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    speaker_user_id BIGINT    REFERENCES users(id),
    text            TEXT      NOT NULL,
    chunk_index     INT       NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE meeting_minutes (
    id           BIGSERIAL PRIMARY KEY,
    room_id      BIGINT    NOT NULL UNIQUE REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    content      TEXT      NOT NULL,
    is_edited    BOOLEAN   NOT NULL DEFAULT FALSE,
    generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
