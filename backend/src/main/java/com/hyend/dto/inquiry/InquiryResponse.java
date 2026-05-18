package com.hyend.dto.inquiry;

// TODO [H-1] 문의 응답 DTO 구현
public record InquiryResponse(
        Long inquiryId,
        String title,
        String content,
        String author,
        String status
) {
}
