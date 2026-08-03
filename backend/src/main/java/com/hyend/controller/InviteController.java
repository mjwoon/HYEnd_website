package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.meeting.InviteTokenResponse;
import com.hyend.dto.meeting.JoinMeetingResponse;
import com.hyend.dto.meeting.MeetingRoomSummary;
import com.hyend.security.UserPrincipal;
import com.hyend.service.InviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class InviteController {

    private final InviteService inviteService;

    @PostMapping("/api/meetings/{roomId}/invite")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InviteTokenResponse> generateInvite(
            @PathVariable Long roomId,
            @RequestParam(required = false) Long expireHours,
            @AuthenticationPrincipal UserPrincipal principal) {
        String token = inviteService.generateInvite(roomId, principal.getId(), expireHours);
        return ApiResponse.ok(new InviteTokenResponse(token));
    }

    @GetMapping("/api/meetings/invite/{token}")
    public ApiResponse<MeetingRoomSummary> getInviteInfo(@PathVariable String token) {
        return ApiResponse.ok(inviteService.getInviteInfo(token));
    }

    @PostMapping("/api/meetings/join/{token}")
    public ApiResponse<JoinMeetingResponse> joinByInvite(
            @PathVariable String token,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(inviteService.joinByInvite(token, principal.getId()));
    }
}
