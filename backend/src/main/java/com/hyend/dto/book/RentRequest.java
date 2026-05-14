package com.hyend.dto.book;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// TODO [H-1] 도서 대출 요청 DTO 구현
public record RentRequest(
        Long bookId,
        String email
) {
}
