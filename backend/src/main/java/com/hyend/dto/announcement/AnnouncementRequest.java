package com.hyend.dto.announcement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Optional;

// TODO [H-1] 공지사항 생성/수정 요청 DTO 구현
public record AnnouncementRequest(
        @NotBlank @Size(max=100) String title,
        @NotBlank String content,
        @NotBlank String category,
        boolean isImportant
) {
}
