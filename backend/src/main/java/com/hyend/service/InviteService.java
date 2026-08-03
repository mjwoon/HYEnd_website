package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.JoinMeetingResponse;
import com.hyend.dto.meeting.MeetingRoomSummary;
import com.hyend.entity.MeetingRoom;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InviteService {

    private static final String KEY_PREFIX = "meeting:invite:";

    private final MeetingRoomRepository roomRepository;
    private final MeetingRoomService meetingRoomService;
    private final StringRedisTemplate stringRedisTemplate;

    @Value("${meeting.invite.default-expire-hours}") private long defaultExpireHours;
    @Value("${meeting.invite.max-expire-hours}") private long maxExpireHours;

    @Transactional
    public String generateInvite(Long roomId, Long userId, Long expireHours) {
        MeetingRoom room = findRoom(roomId);
        if (!room.isHost(userId)) throw new BusinessException(ErrorCode.NOT_MEETING_HOST);
        if (room.isEnded()) throw new BusinessException(ErrorCode.MEETING_ALREADY_ENDED);

        long hours = (expireHours == null) ? defaultExpireHours : Math.min(expireHours, maxExpireHours);
        String token = UUID.randomUUID().toString().replace("-", "");
        stringRedisTemplate.opsForValue().set(KEY_PREFIX + token, roomId.toString(), Duration.ofHours(hours));
        return token;
    }

    public MeetingRoomSummary getInviteInfo(String token) {
        Long roomId = resolveRoomId(token);
        return MeetingRoomSummary.from(findRoom(roomId));
    }

    public JoinMeetingResponse joinByInvite(String token, Long userId) {
        Long roomId = resolveRoomId(token);
        return meetingRoomService.join(roomId, userId);
    }

    private Long resolveRoomId(String token) {
        String value = stringRedisTemplate.opsForValue().get(KEY_PREFIX + token);
        if (value == null) throw new BusinessException(ErrorCode.INVITE_NOT_FOUND);
        return Long.parseLong(value);
    }

    private MeetingRoom findRoom(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
    }
}
