package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.JoinMeetingResponse;
import com.hyend.dto.meeting.MeetingRoomSummary;
import com.hyend.entity.MeetingRoom;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingRoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InviteServiceTest {

    @Mock MeetingRoomRepository roomRepository;
    @Mock MeetingRoomService meetingRoomService;
    @Mock StringRedisTemplate stringRedisTemplate;
    @Mock ValueOperations<String, String> valueOps;
    @InjectMocks InviteService inviteService;

    private User host;
    private MeetingRoom room;

    @BeforeEach
    void setUp() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOps);
        ReflectionTestUtils.setField(inviteService, "defaultExpireHours", 24L);
        ReflectionTestUtils.setField(inviteService, "maxExpireHours", 168L);

        host = mock(User.class);
        when(host.getId()).thenReturn(1L);
        when(host.getName()).thenReturn("호스트");

        room = MeetingRoom.of("테스트 회의", null, host, "room-uuid");
        ReflectionTestUtils.setField(room, "id", 10L);
    }

    @Test
    void generateInvite_hostReceivesToken() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        String token = inviteService.generateInvite(10L, 1L, null);

        assertThat(token).hasSize(32); // UUID without dashes
        verify(valueOps).set(startsWith("meeting:invite:"), eq("10"), any());
    }

    @Test
    void generateInvite_throwsWhenNotHost() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> inviteService.generateInvite(10L, 99L, null))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.NOT_MEETING_HOST);
    }

    @Test
    void generateInvite_throwsWhenRoomEnded() {
        room.end();
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> inviteService.generateInvite(10L, 1L, null))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.MEETING_ALREADY_ENDED);
    }

    @Test
    void getInviteInfo_returnsRoomSummary() {
        when(valueOps.get("meeting:invite:testtoken")).thenReturn("10");
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));

        MeetingRoomSummary summary = inviteService.getInviteInfo("testtoken");

        assertThat(summary.id()).isEqualTo(10L);
        assertThat(summary.title()).isEqualTo("테스트 회의");
    }

    @Test
    void getInviteInfo_throwsWhenTokenExpired() {
        when(valueOps.get(anyString())).thenReturn(null);

        assertThatThrownBy(() -> inviteService.getInviteInfo("expired-token"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVITE_NOT_FOUND);
    }

    @Test
    void joinByInvite_delegatesToMeetingRoomService() {
        JoinMeetingResponse joinResponse = new JoinMeetingResponse("jwt-token", "room-uuid", 10L);
        when(valueOps.get("meeting:invite:validtoken")).thenReturn("10");
        when(meetingRoomService.join(10L, 1L)).thenReturn(joinResponse);

        JoinMeetingResponse result = inviteService.joinByInvite("validtoken", 1L);

        assertThat(result.roomId()).isEqualTo(10L);
        assertThat(result.livekitToken()).isEqualTo("jwt-token");
    }
}
