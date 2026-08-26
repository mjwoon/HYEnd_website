CREATE TABLE announcements (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    content     TEXT         NOT NULL,
    author_id   BIGINT       NOT NULL,
    category_id BIGINT       NOT NULL,
    is_pinned   BOOLEAN      NOT NULL DEFAULT FALSE,
    view_count  INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    CONSTRAINT fk_announcements_author   FOREIGN KEY (author_id)   REFERENCES users (id),
    CONSTRAINT fk_announcements_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE INDEX idx_announcements_category_id ON announcements (category_id);
CREATE INDEX idx_announcements_is_pinned   ON announcements (is_pinned);
CREATE INDEX idx_announcements_created_at  ON announcements (created_at DESC);
