package com.hyend.dto.inquiry;

import java.time.LocalDateTime;

// TODO [H-1] 문의 답변 응답 DTO 구현
public record ReplyResponse(
        Long replyId,
        String content,
        String writer,
        LocalDateTime createdAt
) {
}
