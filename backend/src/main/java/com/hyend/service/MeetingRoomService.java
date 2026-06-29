package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.*;
import com.hyend.entity.*;
import com.hyend.exception.BusinessException;
import com.hyend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MeetingRoomService {

    private final MeetingRoomRepository roomRepository;
    private final MeetingParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final LiveKitService liveKitService;

    @Transactional
    public MeetingRoomResponse create(MeetingRoomRequest request, Long userId) {
        User host = findUser(userId);
        String livekitRoomName = UUID.randomUUID().toString();
        MeetingRoom room = MeetingRoom.of(request.title(), request.description(), host, livekitRoomName);
        liveKitService.createRoom(livekitRoomName);
        return MeetingRoomResponse.from(roomRepository.save(room));
    }

    public List<MeetingRoomSummary> getList() {
        return roomRepository.findAll().stream()
                .filter(r -> r.getStatus() != MeetingRoom.Status.ENDED)
                .map(MeetingRoomSummary::from)
                .toList();
    }

    public MeetingRoomResponse getDetail(Long id) {
        return MeetingRoomResponse.from(findRoom(id));
    }

    @Transactional
    public JoinMeetingResponse join(Long roomId, Long userId) {
        MeetingRoom room = findRoom(roomId);
        if (room.isEnded()) throw new BusinessException(ErrorCode.MEETING_ALREADY_ENDED);

        User user = findUser(userId);
        if (!participantRepository.existsByRoomIdAndUserId(roomId, userId)) {
            participantRepository.save(MeetingParticipant.of(room, user));
        }
        if (room.getStatus() == MeetingRoom.Status.WAITING) room.activate();

        String token = liveKitService.generateToken(room.getLivekitRoomName(), userId.toString(), user.getName());
        return new JoinMeetingResponse(token, room.getLivekitRoomName(), room.getId());
    }

    @Transactional
    public void leave(Long roomId, Long userId) {
        participantRepository.findByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)
                .ifPresent(MeetingParticipant::leave);
    }

    @Transactional
    public void end(Long roomId, Long userId) {
        MeetingRoom room = findRoom(roomId);
        if (!room.isHost(userId)) throw new BusinessException(ErrorCode.NOT_MEETING_HOST);
        if (room.isEnded()) throw new BusinessException(ErrorCode.MEETING_ALREADY_ENDED);
        room.end();
    }

    @Transactional
    public void delete(Long roomId, Long userId) {
        MeetingRoom room = findRoom(roomId);
        if (!room.isHost(userId)) throw new BusinessException(ErrorCode.NOT_MEETING_HOST);
        roomRepository.delete(room);
    }

    private MeetingRoom findRoom(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
