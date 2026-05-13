package com.hyend.dto.event;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

// TODO [H-1] 행사 생성/수정 요청 DTO 구현
public record EventRequest(
        @NotBlank String title,
        @NotBlank String content,

        LocalDateTime startDate,
        LocalDateTime endDate


) {
}
