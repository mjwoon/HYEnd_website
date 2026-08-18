package com.hyend.dto.meeting;

import com.hyend.entity.MeetingChatMessage;

import java.time.LocalDateTime;

public record ChatMessageResponse(
        Long id,
        Long userId,
        String senderName,
        String content,
        String type,
        LocalDateTime createdAt
) {
    public static ChatMessageResponse from(MeetingChatMessage msg) {
        return new ChatMessageResponse(
                msg.getId(),
                msg.getUser().getId(),
                msg.getUser().getName(),
                msg.getContent(),
                msg.getType().name(),
                msg.getCreatedAt()
        );
    }
}
