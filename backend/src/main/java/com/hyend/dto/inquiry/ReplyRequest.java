package com.hyend.dto.inquiry;

import jakarta.validation.constraints.NotBlank;

public record ReplyRequest(
        @NotBlank String content
) {
}
