package com.hyend.service;

import com.hyend.client.OpenAiClient;
import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.MinutesResponse;
import com.hyend.entity.MeetingMinutes;
import com.hyend.entity.MeetingRoom;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingMinutesRepository;
import com.hyend.repository.MeetingRoomRepository;
import com.hyend.repository.MeetingTranscriptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MinutesService {

    private final MeetingRoomRepository roomRepository;
    private final MeetingTranscriptRepository transcriptRepository;
    private final MeetingMinutesRepository minutesRepository;
    private final OpenAiClient openAiClient;
    private final AiQuotaService quotaService;

    @Transactional
    public MinutesResponse generate(Long roomId, Long userId) {
        MeetingRoom room = findRoom(roomId);
        if (!room.isHost(userId)) throw new BusinessException(ErrorCode.NOT_MEETING_HOST);

        String transcript = buildTranscriptText(roomId);
        if (transcript.isBlank()) {
            throw new BusinessException(ErrorCode.MEETING_NOT_ACTIVE);
        }

        long estimatedTokens = openAiClient.estimateTokens(transcript);
        quotaService.consumeLlm(roomId, estimatedTokens);

        String summary = openAiClient.summarize(transcript);

        return minutesRepository.findByRoomId(roomId)
                .map(existing -> {
                    existing.regenerate(summary);
                    return MinutesResponse.from(existing);
                })
                .orElseGet(() -> MinutesResponse.from(minutesRepository.save(MeetingMinutes.of(room, summary))));
    }

    public MinutesResponse getMinutes(Long roomId) {
        return minutesRepository.findByRoomId(roomId)
                .map(MinutesResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.MINUTES_NOT_FOUND));
    }

    @Transactional
    public MinutesResponse updateMinutes(Long roomId, Long userId, String content) {
        MeetingRoom room = findRoom(roomId);
        if (!room.isHost(userId)) throw new BusinessException(ErrorCode.NOT_MEETING_HOST);

        MeetingMinutes minutes = minutesRepository.findByRoomId(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MINUTES_NOT_FOUND));
        minutes.update(content);
        return MinutesResponse.from(minutes);
    }

    private MeetingRoom findRoom(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
    }

    private String buildTranscriptText(Long roomId) {
        return transcriptRepository.findByRoomIdOrderByChunkIndex(roomId).stream()
                .map(t -> (t.getSpeaker() != null ? t.getSpeaker().getName() + ": " : "") + t.getText())
                .reduce("", (a, b) -> a + "\n" + b)
                .strip();
    }
}
