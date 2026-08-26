package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.meeting.ChatMessageResponse;
import com.hyend.dto.meeting.ChatSendRequest;
import com.hyend.security.UserPrincipal;
import com.hyend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @MessageMapping("/chat/{roomId}")
    public void handleStompMessage(
            @DestinationVariable Long roomId,
            ChatSendRequest req,
            Principal principal) {
        if (principal == null) return;
        UserPrincipal up = (UserPrincipal) ((org.springframework.security.authentication.UsernamePasswordAuthenticationToken) principal).getPrincipal();
        chatService.sendMessage(roomId, up.getId(), req);
    }

    @GetMapping("/api/meetings/{id}/chat")
    public ApiResponse<List<ChatMessageResponse>> getHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(chatService.getHistory(id));
    }
}
