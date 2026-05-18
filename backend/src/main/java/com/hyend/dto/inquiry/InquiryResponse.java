package com.hyend.dto.inquiry;

public record InquiryResponse(
        Long inquiryId,
        String title,
        String content,
        String category
) {
}
