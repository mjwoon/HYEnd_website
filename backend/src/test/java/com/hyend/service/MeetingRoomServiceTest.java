package com.hyend.service;

import com.hyend.dto.meeting.JoinMeetingResponse;
import com.hyend.dto.meeting.MeetingRoomRequest;
import com.hyend.dto.meeting.MeetingRoomResponse;
import com.hyend.dto.meeting.MeetingRoomSummary;
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

import java.util.List;
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

    // ---------- create ----------

    @Test
    void create_createsLiveKitRoomAndPersists() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(host));
        when(roomRepository.save(any(MeetingRoom.class))).thenAnswer(inv -> inv.getArgument(0));

        MeetingRoomResponse response = meetingRoomService.create(new MeetingRoomRequest("제목", "설명"), 1L);

        verify(liveKitService).createRoom(anyString());
        verify(roomRepository).save(any(MeetingRoom.class));
        assertThat(response.title()).isEqualTo("제목");
        assertThat(response.hostId()).isEqualTo(1L);
        assertThat(response.status()).isEqualTo("WAITING");
    }

    @Test
    void create_throwsException_whenUserNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> meetingRoomService.create(new MeetingRoomRequest("제목", "설명"), 1L))
                .isInstanceOf(BusinessException.class);
        verify(liveKitService, never()).createRoom(anyString());
    }

    // ---------- join ----------

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
    void join_activatesRoom_whenStatusWaiting() {
        User participant = mock(User.class);
        when(participant.getName()).thenReturn("참가자");
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(userRepository.findById(2L)).thenReturn(Optional.of(participant));
        when(participantRepository.existsByRoomIdAndUserId(10L, 2L)).thenReturn(false);
        when(liveKitService.generateToken(anyString(), anyString(), anyString())).thenReturn("t");

        meetingRoomService.join(10L, 2L);

        assertThat(room.getStatus()).isEqualTo(MeetingRoom.Status.ACTIVE);
    }

    @Test
    void join_doesNotSaveDuplicateParticipant_whenAlreadyJoined() {
        User participant = mock(User.class);
        when(participant.getName()).thenReturn("참가자");
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(userRepository.findById(2L)).thenReturn(Optional.of(participant));
        when(participantRepository.existsByRoomIdAndUserId(10L, 2L)).thenReturn(true);
        when(liveKitService.generateToken(anyString(), anyString(), anyString())).thenReturn("t");

        meetingRoomService.join(10L, 2L);

        verify(participantRepository, never()).save(any(MeetingParticipant.class));
    }

    @Test
    void join_throwsException_whenRoomAlreadyEnded() {
        room.end();
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> meetingRoomService.join(10L, 2L))
                .isInstanceOf(BusinessException.class);
        verify(participantRepository, never()).save(any(MeetingParticipant.class));
    }

    // ---------- leave ----------

    @Test
    void leave_marksParticipantLeft_whenActiveParticipantExists() {
        MeetingParticipant participant = mock(MeetingParticipant.class);
        when(participantRepository.findByRoomIdAndUserIdAndLeftAtIsNull(10L, 2L))
                .thenReturn(Optional.of(participant));

        meetingRoomService.leave(10L, 2L);

        verify(participant).leave();
    }

    @Test
    void leave_doesNothing_whenNoActiveParticipant() {
        when(participantRepository.findByRoomIdAndUserIdAndLeftAtIsNull(10L, 2L))
                .thenReturn(Optional.empty());

        assertThatCode(() -> meetingRoomService.leave(10L, 2L)).doesNotThrowAnyException();
    }

    // ---------- end ----------

    @Test
    void end_changesStatusToEnded_whenHost() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        meetingRoomService.end(10L, 1L);

        assertThat(room.getStatus()).isEqualTo(MeetingRoom.Status.ENDED);
    }

    @Test
    void end_throwsException_whenNotHost() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> meetingRoomService.end(10L, 99L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void end_throwsException_whenAlreadyEnded() {
        room.end();
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> meetingRoomService.end(10L, 1L))
                .isInstanceOf(BusinessException.class);
    }

    // ---------- delete ----------

    @Test
    void delete_removesRoom_whenHost() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        meetingRoomService.delete(10L, 1L);

        verify(roomRepository).delete(room);
    }

    @Test
    void delete_throwsException_whenNotHost() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> meetingRoomService.delete(10L, 99L))
                .isInstanceOf(BusinessException.class);
        verify(roomRepository, never()).delete(any(MeetingRoom.class));
    }

    // ---------- getList / getDetail ----------

    @Test
    void getList_excludesEndedRooms() {
        MeetingRoom active = MeetingRoom.of("A", "", host, "r1");
        ReflectionTestUtils.setField(active, "id", 1L);
        MeetingRoom ended = MeetingRoom.of("B", "", host, "r2");
        ReflectionTestUtils.setField(ended, "id", 2L);
        ended.end();
        when(roomRepository.findAll()).thenReturn(List.of(active, ended));

        List<MeetingRoomSummary> list = meetingRoomService.getList();

        assertThat(list).hasSize(1);
        assertThat(list.get(0).id()).isEqualTo(1L);
    }

    @Test
    void getDetail_throwsException_whenNotFound() {
        when(roomRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> meetingRoomService.getDetail(999L))
                .isInstanceOf(BusinessException.class);
    }
}
