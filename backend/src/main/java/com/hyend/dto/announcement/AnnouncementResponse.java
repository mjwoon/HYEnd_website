package com.hyend.dto.announcement;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

// TODO [H-1] 공지사항 상세 응답 DTO 구현
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
