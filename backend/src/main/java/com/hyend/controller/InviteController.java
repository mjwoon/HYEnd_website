package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.meeting.InviteRequest;
import com.hyend.dto.meeting.InviteResponse;
import com.hyend.security.UserPrincipal;
import com.hyend.service.InviteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class InviteController {

    private final InviteService inviteService;

    @PostMapping("/api/meetings/{id}/invite")
    public ApiResponse<InviteResponse> createInvite(
            @PathVariable Long id,
            @Valid @RequestBody InviteRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(inviteService.createInvite(id, principal.getId(), request.expiresInHours()));
    }

    @GetMapping("/api/invite/{token}")
    public ApiResponse<Long> resolveInvite(@PathVariable String token) {
        return ApiResponse.ok(inviteService.resolveInvite(token));
    }
}
