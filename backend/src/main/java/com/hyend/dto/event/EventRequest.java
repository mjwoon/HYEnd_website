package com.hyend.dto.event;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record EventRequest(
        @NotBlank String title,
        @NotBlank String description,
        String location,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String author


) {
}
