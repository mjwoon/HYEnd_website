package com.hyend.dto.meeting;

import java.time.LocalDateTime;

public record InviteResponse(
        String inviteUrl,
        String token,
        LocalDateTime expiresAt
) {}
