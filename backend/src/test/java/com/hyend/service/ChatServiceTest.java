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
class ChatServiceTest {

    @Mock MeetingRoomRepository roomRepository;
    @Mock MeetingChatMessageRepository chatRepository;
    @Mock MeetingParticipantRepository participantRepository;
    @Mock UserRepository userRepository;
    @Mock NotificationService notificationService;
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
    void sendTextMessage_savesAndReturnsResponse() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(participantRepository.existsByRoomIdAndUserId(10L, 1L)).thenReturn(true);
        when(chatRepository.save(any(MeetingChatMessage.class))).thenReturn(chatMessage);

        ChatMessageResponse result = chatService.sendTextMessage(10L, 1L, "안녕하세요");

        assertThat(result.content()).isEqualTo("안녕하세요");
        assertThat(result.userName()).isEqualTo("테스터");
        verify(notificationService).notifyChat(eq(10L), eq("테스터"), eq("안녕하세요"));
    }

    @Test
    void sendTextMessage_throwsWhenNotParticipant() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(participantRepository.existsByRoomIdAndUserId(10L, 1L)).thenReturn(false);

        assertThatThrownBy(() -> chatService.sendTextMessage(10L, 1L, "안녕"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.ACCESS_DENIED);
    }

    @Test
    void getHistory_returnsOrderedMessages() {
        when(roomRepository.existsById(10L)).thenReturn(true);
        when(chatRepository.findByRoomIdOrderByCreatedAtAsc(10L)).thenReturn(List.of(chatMessage));

        List<ChatMessageResponse> result = chatService.getHistory(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).type()).isEqualTo("TEXT");
    }

    @Test
    void getHistory_throwsWhenRoomNotFound() {
        when(roomRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> chatService.getHistory(99L))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.MEETING_NOT_FOUND);
    }
}
