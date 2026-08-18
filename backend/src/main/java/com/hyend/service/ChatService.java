package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.meeting.ChatMessageResponse;
import com.hyend.dto.meeting.ChatSendRequest;
import com.hyend.entity.MeetingChatMessage;
import com.hyend.entity.MeetingRoom;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.MeetingChatMessageRepository;
import com.hyend.repository.MeetingRoomRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final MeetingChatMessageRepository chatRepository;
    private final MeetingRoomRepository meetingRoomRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessageResponse sendMessage(Long roomId, Long userId, ChatSendRequest req) {
        MeetingRoom room = meetingRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        MeetingChatMessage saved = chatRepository.save(
                MeetingChatMessage.builder()
                        .room(room)
                        .user(user)
                        .content(req.content())
                        .build()
        );
        ChatMessageResponse response = ChatMessageResponse.from(saved);
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/chat", response);
        return response;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getHistory(Long roomId) {
        return chatRepository.findTop100ByRoomIdOrderByCreatedAtAsc(roomId)
                .stream()
                .map(ChatMessageResponse::from)
                .toList();
    }
}
