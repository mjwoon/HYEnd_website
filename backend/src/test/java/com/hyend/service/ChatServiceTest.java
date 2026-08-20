package com.hyend.service;

import com.hyend.dto.meeting.ChatMessageResponse;
import com.hyend.dto.meeting.ChatSendRequest;
import com.hyend.entity.MeetingChatMessage;
import com.hyend.entity.MeetingRoom;
import com.hyend.entity.User;
import com.hyend.repository.MeetingChatMessageRepository;
import com.hyend.repository.MeetingRoomRepository;
import com.hyend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock MeetingRoomRepository roomRepository;
    @Mock MeetingChatMessageRepository chatRepository;
    @Mock UserRepository userRepository;
    @Mock SimpMessagingTemplate messagingTemplate;
    @InjectMocks ChatService chatService;

    private User sender;
    private MeetingRoom room;
    private MeetingChatMessage chatMessage;

    @BeforeEach
    void setUp() {
        sender = mock(User.class);
        when(sender.getId()).thenReturn(1L);
        when(sender.getName()).thenReturn("테스터");

        room = MeetingRoom.of("회의", null, sender, "room-uuid");
        ReflectionTestUtils.setField(room, "id", 10L);

        chatMessage = MeetingChatMessage.text(room, sender, "안녕하세요");
        ReflectionTestUtils.setField(chatMessage, "id", 1L);
    }

    @Test
    void sendMessage_savesAndBroadcasts() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(chatRepository.save(any(MeetingChatMessage.class))).thenReturn(chatMessage);

        ChatMessageResponse result = chatService.sendMessage(10L, 1L, new ChatSendRequest("안녕하세요"));

        assertThat(result.content()).isEqualTo("안녕하세요");
        assertThat(result.senderName()).isEqualTo("테스터");
        verify(messagingTemplate).convertAndSend(eq("/topic/room/10/chat"), any(ChatMessageResponse.class));
    }

    @Test
    void getHistory_returnsMessages() {
        when(chatRepository.findTop100ByRoomIdOrderByCreatedAtAsc(10L)).thenReturn(List.of(chatMessage));

        List<ChatMessageResponse> result = chatService.getHistory(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).type()).isEqualTo("TEXT");
    }
}
