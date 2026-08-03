package com.hyend.dto.meeting;

import com.hyend.entity.MeetingChatMessage;
import java.time.LocalDateTime;

public record ChatMessageResponse(
        Long id,
        Long roomId,
        Long userId,
        String userName,
        String type,
        String content,
        String fileUrl,
        String fileName,
        Long fileSize,
        LocalDateTime createdAt
) {
    public static ChatMessageResponse from(MeetingChatMessage m) {
        return new ChatMessageResponse(
                m.getId(),
                m.getRoom().getId(),
                m.getUser().getId(),
                m.getUser().getName(),
                m.getType().name(),
                m.getContent(),
                m.getFileUrl(),
                m.getFileName(),
                m.getFileSize(),
                m.getCreatedAt()
        );
    }
}
