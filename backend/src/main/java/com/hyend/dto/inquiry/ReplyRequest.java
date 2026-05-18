package com.hyend.dto.inquiry;

import jakarta.validation.constraints.NotBlank;

// TODO [H-1] 문의 답변 요청 DTO 구현
public record ReplyRequest(
        @NotBlank String content
) {
}
