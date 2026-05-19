package com.hyend.dto.book;

import jakarta.validation.constraints.NotBlank;

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
