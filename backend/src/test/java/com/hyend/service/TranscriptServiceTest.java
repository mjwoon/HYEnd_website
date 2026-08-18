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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TranscriptServiceTest {

    @Mock MeetingRoomRepository roomRepository;
    @Mock MeetingTranscriptRepository transcriptRepository;
    @Mock UserRepository userRepository;
    @Mock WhisperService whisperService;
    @Mock SimpMessagingTemplate messagingTemplate;
    @InjectMocks TranscriptService transcriptService;

    private User speaker;
    private MeetingRoom room;
    private MeetingTranscript transcript;

    @BeforeEach
    void setUp() {
        speaker = mock(User.class);
        when(speaker.getId()).thenReturn(1L);
        when(speaker.getName()).thenReturn("테스터");

        room = MeetingRoom.of("테스트 회의", null, speaker, "room-uuid");
        room.activate();
        ReflectionTestUtils.setField(room, "id", 10L);

        transcript = MeetingTranscript.builder()
                .room(room).speaker(speaker).text("안녕하세요").chunkIndex(0)
                .build();
        ReflectionTestUtils.setField(transcript, "id", 1L);
    }

    @Test
    void uploadChunk_savesTranscriptAndBroadcasts() {
        MockMultipartFile audio = new MockMultipartFile("audio", "chunk.webm", "audio/webm", new byte[4000]);
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(userRepository.getReferenceById(1L)).thenReturn(speaker);
        when(whisperService.transcribe(any())).thenReturn("안녕하세요");
        when(transcriptRepository.save(any())).thenReturn(transcript);

        TranscriptChunkResponse result = transcriptService.uploadChunk(10L, 1L, audio, 0);

        assertThat(result.text()).isEqualTo("안녕하세요");
        assertThat(result.chunkIndex()).isEqualTo(0);
        assertThat(result.speakerName()).isEqualTo("테스터");
        verify(messagingTemplate).convertAndSend(eq("/topic/room/10/transcript"), any(TranscriptChunkResponse.class));
    }

    @Test
    void uploadChunk_throwsWhenRoomNotActive() {
        room.end();
        MockMultipartFile audio = new MockMultipartFile("audio", "chunk.webm", "audio/webm", new byte[1000]);
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> transcriptService.uploadChunk(10L, 1L, audio, 0))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.MEETING_NOT_ACTIVE);
    }

    @Test
    void uploadChunk_throwsWhenRoomNotFound() {
        MockMultipartFile audio = new MockMultipartFile("audio", "chunk.webm", "audio/webm", new byte[1000]);
        when(roomRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transcriptService.uploadChunk(99L, 1L, audio, 0))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.MEETING_NOT_FOUND);
    }
}
