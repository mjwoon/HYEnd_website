package com.hyend.dto.inquiry;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// TODO [H-1] 문의 생성 요청 DTO 구현
public record InquiryRequest(

        @NotBlank @Size(max=100) String title,
        @NotBlank String content,
        @NotBlank String category

) {
}
