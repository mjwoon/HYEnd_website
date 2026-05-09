package com.hyend.dto.announcement;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public record AnnouncementResponse(
        Long id,
        String title,
        String content,
        String category,
        String writer,
        boolean isImportant,
        int viewCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt

) {
}
