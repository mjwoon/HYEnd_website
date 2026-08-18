package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.config.VapidKeyConfig;
import com.hyend.dto.push.PushSubscriptionRequest;
import com.hyend.security.UserPrincipal;
import com.hyend.service.WebPushService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {

    private final WebPushService webPushService;
    private final VapidKeyConfig vapidKeyConfig;

    @GetMapping("/vapid-public-key")
    public ApiResponse<Map<String, String>> getVapidPublicKey() {
        return ApiResponse.ok(Map.of("key", vapidKeyConfig.getPublicKey()));
    }

    @PostMapping("/subscribe")
    public ApiResponse<Void> subscribe(
            @Valid @RequestBody PushSubscriptionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        webPushService.saveSubscription(principal.getId(), request);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/subscribe")
    public ApiResponse<Void> unsubscribe(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        webPushService.removeSubscription(principal.getId(), body.get("endpoint"));
        return ApiResponse.ok(null);
    }
}
