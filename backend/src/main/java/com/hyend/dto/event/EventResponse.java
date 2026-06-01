package com.hyend.dto.event;

import java.time.LocalDateTime;

public record EventResponse(
        Long eventId,
        String title,
        String description,
        String location,
        LocalDateTime startDate,
        LocalDateTime endDate
) {
}
