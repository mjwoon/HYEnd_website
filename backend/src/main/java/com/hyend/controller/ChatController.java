package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.meeting.ChatMessageRequest;
import com.hyend.dto.meeting.ChatMessageResponse;
import com.hyend.security.UserPrincipal;
import com.hyend.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // STOMP: /app/meeting/{roomId}/chat
    @MessageMapping("/meeting/{roomId}/chat")
    public void handleChat(@DestinationVariable Long roomId, @Payload ChatMessageRequest request, Principal principal) {
        Long userId = ((UserPrincipal) ((org.springframework.security.core.Authentication) principal).getPrincipal()).getId();
        ChatMessageResponse response = chatService.sendTextMessage(roomId, userId, request.content());
        messagingTemplate.convertAndSend("/topic/meeting/" + roomId + "/chat", response);
    }

    // REST: 채팅 이력 조회
    @GetMapping("/api/meetings/{roomId}/chat")
    public ApiResponse<List<ChatMessageResponse>> getHistory(@PathVariable Long roomId) {
        return ApiResponse.ok(chatService.getHistory(roomId));
    }
}
