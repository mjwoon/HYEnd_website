package com.hyend.dto.announcement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Optional;

public record AnnouncementRequest(
        @NotBlank @Size(max=100) String title,
        @NotBlank String content,
        @NotBlank String category,
        boolean isImportant
) {
}
