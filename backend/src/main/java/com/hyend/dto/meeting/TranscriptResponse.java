package com.hyend.dto.meeting;

import com.hyend.entity.MeetingTranscript;
import java.time.LocalDateTime;

public record TranscriptResponse(
        Long id,
        Long roomId,
        Long speakerId,
        String speakerName,
        String text,
        int chunkIndex,
        LocalDateTime createdAt
) {
    public static TranscriptResponse from(MeetingTranscript t) {
        return new TranscriptResponse(
                t.getId(),
                t.getRoom().getId(),
                t.getSpeaker() != null ? t.getSpeaker().getId() : null,
                t.getSpeaker() != null ? t.getSpeaker().getName() : null,
                t.getText(),
                t.getChunkIndex(),
                t.getCreatedAt()
        );
    }
}
