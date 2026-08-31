package com.hyend.dto.announcement;

import com.hyend.dto.file.AttachmentResponse;

import java.time.LocalDateTime;
import java.util.List;

public record AnnouncementResponse(
        Long id,
        String title,
        String content,
        String category,
        String writer,
        boolean isImportant,
        int viewCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<AttachmentResponse> attachments
) {
}
