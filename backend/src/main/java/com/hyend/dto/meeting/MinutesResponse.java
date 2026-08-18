package com.hyend.dto.meeting;

import com.hyend.entity.MeetingMinutes;
import java.time.LocalDateTime;

public record MinutesResponse(
        Long id,
        Long roomId,
        String content,
        boolean isEdited,
        LocalDateTime generatedAt,
        LocalDateTime updatedAt
) {
    public static MinutesResponse from(MeetingMinutes m) {
        return new MinutesResponse(
                m.getId(),
                m.getRoom().getId(),
                m.getContent(),
                m.isEdited(),
                m.getGeneratedAt(),
                m.getUpdatedAt()
        );
    }
}
