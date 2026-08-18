package com.hyend.dto.book;

import jakarta.validation.constraints.NotNull;

public record RentRequest(
        @NotNull Long bookId
) {
}
