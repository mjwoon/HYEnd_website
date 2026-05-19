package com.hyend.dto.book;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RentRequest(
        Long bookId,
        String email
) {
}
