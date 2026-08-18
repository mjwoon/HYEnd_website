package com.hyend.dto.announcement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnnouncementRequest(
        @NotBlank @Size(max=100) String title,
        @NotBlank String content,
        @NotBlank String category,
        boolean isImportant
) {
}
