package com.hyend.service;

import com.hyend.client.OpenAiClient;
import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.TranscriptResponse;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TranscriptServiceTest {

    @Mock MeetingRoomRepository roomRepository;
    @Mock MeetingTranscriptRepository transcriptRepository;
    @Mock UserRepository userRepository;
    @Mock OpenAiClient openAiClient;
    @Mock AiQuotaService quotaService;
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
        ReflectionTestUtils.setField(room, "id", 10L);

        transcript = MeetingTranscript.of(room, speaker, "안녕하세요", 0);
        ReflectionTestUtils.setField(transcript, "id", 1L);
    }

    @Test
    void transcribeAsync_savesTranscriptAndReturnsResponse() throws Exception {
        MockMultipartFile audio = new MockMultipartFile("audio", "chunk.webm", "audio/webm", new byte[4000]);
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(userRepository.findById(1L)).thenReturn(Optional.of(speaker));
        when(openAiClient.transcribe(any(), any())).thenReturn("안녕하세요");
        when(transcriptRepository.save(any())).thenReturn(transcript);

        TranscriptResponse result = transcriptService.transcribeAsync(10L, 1L, audio, 0).get();

        assertThat(result.text()).isEqualTo("안녕하세요");
        assertThat(result.chunkIndex()).isEqualTo(0);
        verify(quotaService).consumeWhisper(eq(10L), anyLong());
    }

    @Test
    void transcribeAsync_throwsWhenRoomEnded() {
        room.end();
        MockMultipartFile audio = new MockMultipartFile("audio", "chunk.webm", "audio/webm", new byte[1000]);
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        // @Async 프록시가 없는 단위 테스트에서는 예외가 직접 던져진다
        assertThatThrownBy(() -> transcriptService.transcribeAsync(10L, 1L, audio, 0))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.MEETING_ALREADY_ENDED);
    }

    @Test
    void transcribeAsync_throwsWhenRoomNotFound() {
        MockMultipartFile audio = new MockMultipartFile("audio", "chunk.webm", "audio/webm", new byte[1000]);
        when(roomRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transcriptService.transcribeAsync(99L, 1L, audio, 0))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.MEETING_NOT_FOUND);
    }

    @Test
    void getTranscripts_returnsOrderedList() {
        when(roomRepository.existsById(10L)).thenReturn(true);
        when(transcriptRepository.findByRoomIdOrderByChunkIndex(10L)).thenReturn(List.of(transcript));

        List<TranscriptResponse> result = transcriptService.getTranscripts(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).speakerName()).isEqualTo("테스터");
    }

    @Test
    void getTranscripts_throwsWhenRoomNotFound() {
        when(roomRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> transcriptService.getTranscripts(99L))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.MEETING_NOT_FOUND);
    }
}
