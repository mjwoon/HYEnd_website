package com.hyend.dto.meeting;

import com.hyend.entity.MeetingRoom;
import java.time.LocalDateTime;

public record MeetingRoomSummary(
        Long id,
        String title,
        String status,
        String hostName,
        LocalDateTime createdAt
) {
    public static MeetingRoomSummary from(MeetingRoom room) {
        return new MeetingRoomSummary(
                room.getId(),
                room.getTitle(),
                room.getStatus().name(),
                room.getHost().getName(),
                room.getCreatedAt()
        );
    }
}
