package com.hyend.dto.book;

import java.time.LocalDateTime;

// TODO [H-1] 도서 대출 응답 DTO 구현
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
