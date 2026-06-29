package com.hyend.dto.meeting;

import com.hyend.entity.MeetingRoom;
import java.time.LocalDateTime;

public record MeetingRoomResponse(
        Long id,
        String title,
        String description,
        Long hostId,
        String hostName,
        String status,
        String livekitRoomName,
        LocalDateTime createdAt,
        LocalDateTime endedAt
) {
    public static MeetingRoomResponse from(MeetingRoom room) {
        return new MeetingRoomResponse(
                room.getId(),
                room.getTitle(),
                room.getDescription(),
                room.getHost().getId(),
                room.getHost().getName(),
                room.getStatus().name(),
                room.getLivekitRoomName(),
                room.getCreatedAt(),
                room.getEndedAt()
        );
    }
}
