package com.hyend.dto.inquiry;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InquiryRequest(

        @NotBlank @Size(max=100) String title,
        @NotBlank String content,
        @NotBlank String category

) {
}
