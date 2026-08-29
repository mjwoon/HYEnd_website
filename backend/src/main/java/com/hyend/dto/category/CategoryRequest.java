package com.hyend.dto.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// TODO [H-1] 카테고리 생성/수정 요청 DTO 구현
public record CategoryRequest(
        @NotBlank @Size(max=20) String name
) {
}
