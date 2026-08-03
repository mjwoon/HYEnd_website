package com.hyend.dto.notification;

import jakarta.validation.constraints.NotBlank;

public record FcmTokenRequest(
        @NotBlank String token,
        String userAgent
) {}
