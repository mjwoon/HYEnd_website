package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.InviteResponse;
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
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InviteServiceTest {

    @Mock MeetingRoomRepository meetingRoomRepository;
    @Mock StringRedisTemplate stringRedisTemplate;
    @Mock ValueOperations<String, String> valueOps;
    @InjectMocks InviteService inviteService;

    private User host;
    private MeetingRoom room;

    @BeforeEach
    void setUp() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOps);
        ReflectionTestUtils.setField(inviteService, "baseUrl", "http://localhost");

        host = mock(User.class);
        when(host.getId()).thenReturn(1L);

        room = MeetingRoom.of("테스트 회의", null, host, "room-uuid");
        ReflectionTestUtils.setField(room, "id", 10L);
    }

    @Test
    void createInvite_hostReceivesInviteUrl() {
        when(meetingRoomRepository.findById(10L)).thenReturn(Optional.of(room));

        InviteResponse response = inviteService.createInvite(10L, 1L, 24);

        assertThat(response.token()).hasSize(32);
        assertThat(response.inviteUrl()).contains(response.token());
        verify(valueOps).set(startsWith("meeting:invite:"), eq("10"), eq(24L), any());
    }

    @Test
    void createInvite_throwsWhenNotHost() {
        when(meetingRoomRepository.findById(10L)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> inviteService.createInvite(10L, 99L, 24))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.NOT_MEETING_HOST);
    }

    @Test
    void createInvite_throwsWhenRoomEnded() {
        room.end();
        when(meetingRoomRepository.findById(10L)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> inviteService.createInvite(10L, 1L, 24))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.MEETING_ALREADY_ENDED);
    }

    @Test
    void resolveInvite_returnsRoomId() {
        when(valueOps.get("meeting:invite:testtoken")).thenReturn("10");

        Long roomId = inviteService.resolveInvite("testtoken");

        assertThat(roomId).isEqualTo(10L);
    }

    @Test
    void resolveInvite_throwsWhenTokenExpired() {
        when(valueOps.get(anyString())).thenReturn(null);

        assertThatThrownBy(() -> inviteService.resolveInvite("expired-token"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVITE_NOT_FOUND);
    }
}
