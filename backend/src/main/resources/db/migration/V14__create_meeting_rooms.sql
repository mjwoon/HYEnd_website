CREATE TABLE meeting_rooms (
    id                  BIGSERIAL PRIMARY KEY,
    title               VARCHAR(100)  NOT NULL,
    description         TEXT,
    host_user_id        BIGINT        NOT NULL REFERENCES users(id),
    livekit_room_name   VARCHAR(64)   NOT NULL UNIQUE,
    status              VARCHAR(16)   NOT NULL DEFAULT 'WAITING',
    created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
    ended_at            TIMESTAMP
);

CREATE TABLE meeting_participants (
    id          BIGSERIAL PRIMARY KEY,
    room_id     BIGINT    NOT NULL REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    user_id     BIGINT    NOT NULL REFERENCES users(id),
    joined_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    left_at     TIMESTAMP,
    UNIQUE (room_id, user_id)
);
