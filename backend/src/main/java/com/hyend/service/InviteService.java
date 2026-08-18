package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.InviteResponse;
import com.hyend.entity.MeetingRoom;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class InviteService {

    private final StringRedisTemplate stringRedisTemplate;
    private final MeetingRoomRepository meetingRoomRepository;

    @Value("${app.base-url:https://hyend.ac.kr}")
    private String baseUrl;

    public InviteResponse createInvite(Long roomId, Long userId, int expiresInHours) {
        MeetingRoom room = meetingRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
        if (!room.isHost(userId)) throw new BusinessException(ErrorCode.NOT_MEETING_HOST);

        String token = UUID.randomUUID().toString().replace("-", "");
        String key = "meeting:invite:" + token;
        stringRedisTemplate.opsForValue().set(key, roomId.toString(), expiresInHours, TimeUnit.HOURS);

        return new InviteResponse(
                "%s/invite/%s".formatted(baseUrl, token),
                token,
                LocalDateTime.now().plusHours(expiresInHours)
        );
    }

    public Long resolveInvite(String token) {
        String val = stringRedisTemplate.opsForValue().get("meeting:invite:" + token);
        if (val == null) throw new BusinessException(ErrorCode.INVITE_NOT_FOUND);
        return Long.parseLong(val);
    }
}
