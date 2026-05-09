package com.hyend.dto.announcement;

import java.time.LocalDateTime;

public record AnnouncementSummary(
        Long id,
        String title,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
