CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    CONSTRAINT uq_categories_name UNIQUE (name)
);
