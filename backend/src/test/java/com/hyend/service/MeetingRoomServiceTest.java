package com.hyend.service;

import com.hyend.dto.meeting.JoinMeetingResponse;
import com.hyend.dto.meeting.MeetingRoomRequest;
import com.hyend.entity.MeetingRoom;
import com.hyend.entity.MeetingParticipant;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingParticipantRepository;
import com.hyend.repository.MeetingRoomRepository;
import com.hyend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MeetingRoomServiceTest {

    @Mock MeetingRoomRepository roomRepository;
    @Mock MeetingParticipantRepository participantRepository;
    @Mock UserRepository userRepository;
    @Mock LiveKitService liveKitService;
    @InjectMocks MeetingRoomService meetingRoomService;

    private User host;
    private MeetingRoom room;

    @BeforeEach
    void setUp() {
        host = mock(User.class);
        when(host.getId()).thenReturn(1L);
        when(host.getName()).thenReturn("호스트");

        room = MeetingRoom.of("테스트 회의", "설명", host, "room-uuid");
        ReflectionTestUtils.setField(room, "id", 10L);
    }

    @Test
    void join_returnsLiveKitToken_whenRoomIsWaiting() {
        User participant = mock(User.class);
        when(participant.getId()).thenReturn(2L);
        when(participant.getName()).thenReturn("참가자");
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(userRepository.findById(2L)).thenReturn(Optional.of(participant));
        when(participantRepository.existsByRoomIdAndUserId(10L, 2L)).thenReturn(false);
        when(liveKitService.generateToken(anyString(), anyString(), anyString())).thenReturn("livekit.jwt.token");

        JoinMeetingResponse response = meetingRoomService.join(10L, 2L);

        assertThat(response.livekitToken()).isEqualTo("livekit.jwt.token");
        assertThat(response.roomName()).isEqualTo("room-uuid");
        verify(participantRepository).save(any(MeetingParticipant.class));
    }

    @Test
    void end_throwsException_whenNotHost() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> meetingRoomService.end(10L, 99L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void end_changesStatusToEnded_whenHost() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        meetingRoomService.end(10L, 1L);

        assertThat(room.getStatus()).isEqualTo(MeetingRoom.Status.ENDED);
    }
}
