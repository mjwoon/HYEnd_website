package com.hyend.service;

import com.hyend.client.OpenAiClient;
import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.MinutesResponse;
import com.hyend.entity.MeetingMinutes;
import com.hyend.entity.MeetingRoom;
import com.hyend.entity.MeetingTranscript;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingMinutesRepository;
import com.hyend.repository.MeetingRoomRepository;
import com.hyend.repository.MeetingTranscriptRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MinutesServiceTest {

    @Mock MeetingRoomRepository roomRepository;
    @Mock MeetingTranscriptRepository transcriptRepository;
    @Mock MeetingMinutesRepository minutesRepository;
    @Mock OpenAiClient openAiClient;
    @Mock AiQuotaService quotaService;
    @InjectMocks MinutesService minutesService;

    private User host;
    private MeetingRoom room;
    private MeetingTranscript transcript;

    @BeforeEach
    void setUp() {
        host = mock(User.class);
        when(host.getId()).thenReturn(1L);
        when(host.getName()).thenReturn("호스트");

        room = MeetingRoom.of("회의", null, host, "room-uuid");
        ReflectionTestUtils.setField(room, "id", 10L);

        transcript = MeetingTranscript.of(room, host, "회의 내용입니다.", 0);
        ReflectionTestUtils.setField(transcript, "id", 1L);
    }

    @Test
    void generate_createsNewMinutes() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(transcriptRepository.findByRoomIdOrderByChunkIndex(10L)).thenReturn(List.of(transcript));
        when(openAiClient.estimateTokens(anyString())).thenReturn(100L);
        when(openAiClient.summarize(anyString())).thenReturn("{\"summary\":\"회의 요약\"}");
        when(minutesRepository.findByRoomId(10L)).thenReturn(Optional.empty());
        when(minutesRepository.save(any(MeetingMinutes.class))).thenAnswer(inv -> {
            MeetingMinutes m = inv.getArgument(0);
            ReflectionTestUtils.setField(m, "id", 1L);
            return m;
        });

        MinutesResponse result = minutesService.generate(10L, 1L);

        assertThat(result.content()).contains("회의 요약");
        assertThat(result.roomId()).isEqualTo(10L);
    }

    @Test
    void generate_throwsWhenNoTranscripts() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(transcriptRepository.findByRoomIdOrderByChunkIndex(10L)).thenReturn(List.of());

        assertThatThrownBy(() -> minutesService.generate(10L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.MEETING_NOT_ACTIVE);
    }

    @Test
    void generate_regeneratesExistingMinutes() {
        MeetingMinutes existing = MeetingMinutes.of(room, "이전 내용");
        ReflectionTestUtils.setField(existing, "id", 1L);

        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(transcriptRepository.findByRoomIdOrderByChunkIndex(10L)).thenReturn(List.of(transcript));
        when(openAiClient.estimateTokens(anyString())).thenReturn(100L);
        when(openAiClient.summarize(anyString())).thenReturn("{\"summary\":\"새 요약\"}");
        when(minutesRepository.findByRoomId(10L)).thenReturn(Optional.of(existing));

        MinutesResponse result = minutesService.generate(10L, 1L);

        assertThat(result.content()).contains("새 요약");
    }

    @Test
    void generate_throwsWhenNotHost() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> minutesService.generate(10L, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.NOT_MEETING_HOST);
    }

    @Test
    void getMinutes_returnsExistingMinutes() {
        MeetingMinutes minutes = MeetingMinutes.of(room, "회의록 내용");
        ReflectionTestUtils.setField(minutes, "id", 1L);
        when(minutesRepository.findByRoomId(10L)).thenReturn(Optional.of(minutes));

        MinutesResponse result = minutesService.getMinutes(10L);

        assertThat(result.content()).isEqualTo("회의록 내용");
    }

    @Test
    void getMinutes_throwsWhenNotFound() {
        when(minutesRepository.findByRoomId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> minutesService.getMinutes(99L))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.MINUTES_NOT_FOUND);
    }
}
