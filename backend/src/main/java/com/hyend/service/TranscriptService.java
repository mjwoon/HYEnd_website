package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.TranscriptChunkResponse;
import com.hyend.entity.MeetingRoom;
import com.hyend.entity.MeetingTranscript;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingRoomRepository;
import com.hyend.repository.MeetingTranscriptRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class TranscriptService {

    private final WhisperService whisperService;
    private final MeetingRoomRepository meetingRoomRepository;
    private final MeetingTranscriptRepository transcriptRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public TranscriptChunkResponse uploadChunk(Long roomId, Long userId, MultipartFile audio, int chunkIndex) {
        MeetingRoom room = meetingRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));

        if (room.getStatus() != MeetingRoom.Status.ACTIVE) {
            throw new BusinessException(ErrorCode.MEETING_NOT_ACTIVE);
        }

        String text = whisperService.transcribe(audio);
        User speaker = userRepository.getReferenceById(userId);

        MeetingTranscript saved = transcriptRepository.save(
                MeetingTranscript.builder()
                        .room(room)
                        .speaker(speaker)
                        .text(text)
                        .chunkIndex(chunkIndex)
                        .build()
        );

        TranscriptChunkResponse response = new TranscriptChunkResponse(
                saved.getId(),
                saved.getChunkIndex(),
                saved.getText(),
                speaker.getName()
        );
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/transcript", response);
        return response;
    }
}
