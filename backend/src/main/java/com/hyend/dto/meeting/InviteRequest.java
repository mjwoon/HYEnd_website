package com.hyend.dto.meeting;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record InviteRequest(
        @Min(1) @Max(168)
        int expiresInHours
) {}
