package com.hyend.dto.meeting;

public record JoinMeetingResponse(
        String livekitToken,
        String roomName,
        Long roomId
) {}
