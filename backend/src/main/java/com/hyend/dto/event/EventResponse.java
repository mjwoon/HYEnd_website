package com.hyend.dto.event;

import java.time.LocalDateTime;

// TODO [H-1] 행사 응답 DTO 구현
public record EventResponse(
        Long eventId,
        String title,
        String content,

        LocalDateTime startDate,
        LocalDateTime endDate
) {
}
