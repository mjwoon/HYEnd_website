package com.hyend.dto.book;

import jakarta.validation.constraints.NotBlank;

// TODO [H-1] 도서 응답 DTO 구현
public record BookResponse(
        Long bookId,
        String title,
        String author,
        String category,
        String summary,
        String imageUrl,
        boolean isAvailable
)
 {
}
