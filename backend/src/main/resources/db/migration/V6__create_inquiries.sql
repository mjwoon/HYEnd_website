CREATE TABLE inquiries (
    id         BIGSERIAL PRIMARY KEY,
    title      VARCHAR(255) NOT NULL,
    content    TEXT         NOT NULL,
    author_id  BIGINT       NOT NULL,
    is_private BOOLEAN      NOT NULL DEFAULT FALSE,
    status     VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_inquiries_author FOREIGN KEY (author_id) REFERENCES users (id)
);

CREATE INDEX idx_inquiries_author_id ON inquiries (author_id);
CREATE INDEX idx_inquiries_status    ON inquiries (status);

CREATE TABLE inquiry_replies (
    id         BIGSERIAL PRIMARY KEY,
    inquiry_id BIGINT NOT NULL,
    author_id  BIGINT NOT NULL,
    content    TEXT   NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_inquiry_replies_inquiry FOREIGN KEY (inquiry_id) REFERENCES inquiries (id),
    CONSTRAINT fk_inquiry_replies_author  FOREIGN KEY (author_id)  REFERENCES users (id)
);

CREATE INDEX idx_inquiry_replies_inquiry_id ON inquiry_replies (inquiry_id);
