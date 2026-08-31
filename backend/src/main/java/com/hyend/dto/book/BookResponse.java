package com.hyend.dto.book;

public record BookResponse(
        Long bookId,
        String title,
        String author,
        boolean isAvailable
) {
}
