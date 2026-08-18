package com.hyend.dto.meeting;

import com.hyend.entity.MeetingMinutes;

import java.time.LocalDateTime;

public record MinutesResponse(
        Long roomId,
        String content,
        LocalDateTime generatedAt
) {
    public static MinutesResponse from(MeetingMinutes m) {
        return new MinutesResponse(m.getRoom().getId(), m.getContent(), m.getGeneratedAt());
    }
}
