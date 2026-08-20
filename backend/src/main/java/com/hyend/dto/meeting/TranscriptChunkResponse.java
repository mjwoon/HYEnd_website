package com.hyend.dto.meeting;

public record TranscriptChunkResponse(
        Long transcriptId,
        int chunkIndex,
        String text,
        String speakerName
) {}
