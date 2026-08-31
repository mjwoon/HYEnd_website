package com.hyend.dto.inquiry;

import java.time.LocalDateTime;

public record ReplyResponse(
        Long replyId,
        String content,
        String writer,
        LocalDateTime createdAt
) {
}
