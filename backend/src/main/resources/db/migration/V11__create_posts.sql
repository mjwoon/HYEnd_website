CREATE TABLE posts (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(100)  NOT NULL,
    content     TEXT          NOT NULL,
    board_type  VARCHAR(20)   NOT NULL,
    author_id   BIGINT        NOT NULL REFERENCES users(id),
    view_count  INT           NOT NULL DEFAULT 0,
    created_at  TIMESTAMP     NOT NULL,
    updated_at  TIMESTAMP     NOT NULL
);

CREATE INDEX idx_posts_board_type ON posts(board_type);
CREATE INDEX idx_posts_author_id  ON posts(author_id);
