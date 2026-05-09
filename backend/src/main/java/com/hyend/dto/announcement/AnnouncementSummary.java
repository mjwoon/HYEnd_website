package com.hyend.dto.announcement;

import java.time.LocalDateTime;

// TODO [H-1] 공지사항 목록용 요약 DTO 구현
public record AnnouncementSummary(
        Long id,
        String title,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
