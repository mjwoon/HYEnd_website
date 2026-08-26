package com.hyend.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private final int status;
    private final String message;
    private final List<FieldError> errors;
    private final LocalDateTime timestamp;

    private ErrorResponse(int status, String message, List<FieldError> errors) {
        this.status = status;
        this.message = message;
        this.errors = errors;
        this.timestamp = LocalDateTime.now();
    }

    public static ErrorResponse of(HttpStatus status, String message) {
        return new ErrorResponse(status.value(), message, null);
    }

    public static ErrorResponse of(HttpStatus status, String message, List<FieldError> errors) {
        return new ErrorResponse(status.value(), message, errors);
    }

    @Getter
    public static class FieldError {
        private final String field;
        private final String message;

        public FieldError(String field, String message) {
            this.field = field;
            this.message = message;
        }
    }
}
