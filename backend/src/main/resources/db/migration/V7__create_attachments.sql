CREATE TABLE attachments (
    id                BIGSERIAL    PRIMARY KEY,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename   VARCHAR(255) NOT NULL,
    file_url          VARCHAR(255) NOT NULL,
    file_size         BIGINT       NOT NULL,
    content_type      VARCHAR(100) NOT NULL,
    entity_type       VARCHAR(50)  NOT NULL,
    entity_id         BIGINT       NOT NULL,
    uploaded_by_id    BIGINT       NOT NULL,
    created_at        TIMESTAMP,
    updated_at        TIMESTAMP,
    CONSTRAINT fk_attachments_uploader FOREIGN KEY (uploaded_by_id) REFERENCES users (id)
);

CREATE INDEX idx_attachments_entity ON attachments (entity_type, entity_id);
