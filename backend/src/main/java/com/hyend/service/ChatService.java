package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.ChatMessageResponse;
import com.hyend.entity.MeetingChatMessage;
import com.hyend.entity.MeetingRoom;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingChatMessageRepository;
import com.hyend.repository.MeetingParticipantRepository;
import com.hyend.repository.MeetingRoomRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final MeetingRoomRepository roomRepository;
    private final MeetingChatMessageRepository chatRepository;
    private final MeetingParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ChatMessageResponse sendTextMessage(Long roomId, Long userId, String content) {
        MeetingRoom room = findRoom(roomId);
        User sender = findUser(userId);
        validateParticipant(roomId, userId);

        MeetingChatMessage message = chatRepository.save(MeetingChatMessage.text(room, sender, content));

        notificationService.notifyChat(roomId, sender.getName(), content);

        return ChatMessageResponse.from(message);
    }

    public List<ChatMessageResponse> getHistory(Long roomId) {
        if (!roomRepository.existsById(roomId)) {
            throw new BusinessException(ErrorCode.MEETING_NOT_FOUND);
        }
        return chatRepository.findByRoomIdOrderByCreatedAtAsc(roomId).stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    private void validateParticipant(Long roomId, Long userId) {
        boolean isParticipant = participantRepository.existsByRoomIdAndUserId(roomId, userId);
        if (!isParticipant) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
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
