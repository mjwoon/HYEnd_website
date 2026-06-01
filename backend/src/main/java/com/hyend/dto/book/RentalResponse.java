package com.hyend.dto.book;

import java.time.LocalDateTime;

public record RentalResponse(
        Long rentalId,
        Long bookId,
        String title,
        String author,
        String category,
        boolean isAvailable,
        boolean canExtend,
        LocalDateTime startDate,
        LocalDateTime endDate
) {
}
