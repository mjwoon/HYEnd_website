package com.hyend.service;

import com.hyend.client.OpenAiClient;
import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.TranscriptChunkResponse;
import com.hyend.dto.meeting.TranscriptResponse;
import com.hyend.entity.MeetingRoom;
import com.hyend.entity.MeetingTranscript;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingRoomRepository;
import com.hyend.repository.MeetingTranscriptRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TranscriptService {

    private final MeetingRoomRepository roomRepository;
    private final MeetingTranscriptRepository transcriptRepository;
    private final UserRepository userRepository;
    private final OpenAiClient openAiClient;
    private final AiQuotaService quotaService;
    private final SimpMessagingTemplate messagingTemplate;

    @Async("aiTaskExecutor")
    @Transactional
    public CompletableFuture<TranscriptResponse> transcribeAsync(Long roomId, Long userId, MultipartFile audio, int chunkIndex) {
        MeetingRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
        if (room.isEnded()) {
            throw new BusinessException(ErrorCode.MEETING_ALREADY_ENDED);
        }
        User speaker = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // rough estimate: 16kbps webm → ~2KB/s
        long estimatedSeconds = Math.max(1, audio.getSize() / 2000);
        quotaService.consumeWhisper(roomId, estimatedSeconds);

        try {
            String text = openAiClient.transcribe(audio.getBytes(), audio.getOriginalFilename());
            MeetingTranscript transcript = MeetingTranscript.of(room, speaker, text, chunkIndex);
            return CompletableFuture.completedFuture(TranscriptResponse.from(transcriptRepository.save(transcript)));
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Whisper 전사 실패: roomId={}, chunkIndex={}", roomId, chunkIndex, e);
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public TranscriptChunkResponse uploadChunk(Long roomId, Long userId, MultipartFile audio, int chunkIndex) {
        MeetingRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
        if (room.isEnded()) {
            throw new BusinessException(ErrorCode.MEETING_ALREADY_ENDED);
        }
        User speaker = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        long estimatedSeconds = Math.max(1, audio.getSize() / 2000);
        quotaService.consumeWhisper(roomId, estimatedSeconds);

        try {
            String text = openAiClient.transcribe(audio.getBytes(), audio.getOriginalFilename());
            MeetingTranscript transcript = MeetingTranscript.of(room, speaker, text, chunkIndex);
            MeetingTranscript saved = transcriptRepository.save(transcript);
            TranscriptChunkResponse response = new TranscriptChunkResponse(
                    saved.getId(),
                    saved.getChunkIndex(),
                    saved.getText(),
                    speaker.getName()
            );
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/transcript", response);
            return response;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Whisper 전사 실패: roomId={}, chunkIndex={}", roomId, chunkIndex, e);
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    public List<TranscriptResponse> getTranscripts(Long roomId) {
        if (!roomRepository.existsById(roomId)) {
            throw new BusinessException(ErrorCode.MEETING_NOT_FOUND);
        }
        return transcriptRepository.findByRoomIdOrderByChunkIndex(roomId).stream()
                .map(TranscriptResponse::from)
                .toList();
    }
}
