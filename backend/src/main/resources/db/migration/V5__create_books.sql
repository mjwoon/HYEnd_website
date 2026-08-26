CREATE TABLE books (
    id               BIGSERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    author           VARCHAR(255) NOT NULL,
    isbn             VARCHAR(255) NOT NULL,
    total_copies     INTEGER      NOT NULL DEFAULT 1,
    available_copies INTEGER      NOT NULL DEFAULT 1,
    created_at       TIMESTAMP,
    updated_at       TIMESTAMP
);

CREATE TABLE book_rentals (
    id          BIGSERIAL PRIMARY KEY,
    book_id     BIGINT      NOT NULL,
    user_id     BIGINT      NOT NULL,
    rented_at   TIMESTAMP,
    due_date    TIMESTAMP   NOT NULL,
    returned_at TIMESTAMP,
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    CONSTRAINT fk_book_rentals_book FOREIGN KEY (book_id) REFERENCES books (id),
    CONSTRAINT fk_book_rentals_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_book_rentals_user_status ON book_rentals (user_id, status);
CREATE INDEX idx_book_rentals_due_date    ON book_rentals (due_date);
