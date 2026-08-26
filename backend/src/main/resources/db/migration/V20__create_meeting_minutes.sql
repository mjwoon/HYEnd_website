CREATE TABLE IF NOT EXISTS meeting_minutes (
    id           BIGSERIAL    PRIMARY KEY,
    room_id      BIGINT       NOT NULL UNIQUE REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    content      TEXT         NOT NULL,
    generated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_room_id ON meeting_minutes(room_id);
