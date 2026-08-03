package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.notification.FcmTokenRequest;
import com.hyend.security.UserPrincipal;
import com.hyend.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/fcm-token")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> registerToken(
            @Valid @RequestBody FcmTokenRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.registerToken(principal.getId(), request.token(), request.userAgent());
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/fcm-token")
    public ApiResponse<Void> removeToken(
            @Valid @RequestBody FcmTokenRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.removeToken(principal.getId(), request.token());
        return ApiResponse.ok(null);
    }
}
