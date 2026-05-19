package com.hyend.dto.book;

import java.time.LocalDateTime;

public record RentalResponse(
        Long bookId,
        String title,
        String author,
        String category,

        boolean isAvailable,

        LocalDateTime startDate,
        LocalDateTime endDate
) {
}
