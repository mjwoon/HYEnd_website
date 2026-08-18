package com.hyend.dto.meeting;

import jakarta.validation.constraints.NotBlank;

public record MinutesUpdateRequest(
        @NotBlank String content
) {}
