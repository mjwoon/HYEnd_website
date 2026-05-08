CREATE TABLE events (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    location    VARCHAR(255),
    start_time  TIMESTAMP    NOT NULL,
    end_time    TIMESTAMP,
    author_id   BIGINT       NOT NULL,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    CONSTRAINT fk_events_author FOREIGN KEY (author_id) REFERENCES users (id)
);

CREATE INDEX idx_events_start_time ON events (start_time);
CREATE INDEX idx_events_end_time   ON events (end_time);
