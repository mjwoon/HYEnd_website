package com.hyend.exception;

import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
        log.warn("BusinessException: {}", e.getMessage());
        ErrorResponse response = ErrorResponse.of(e.getErrorCode().getHttpStatus(), e.getMessage());
        return ResponseEntity.status(e.getErrorCode().getHttpStatus()).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        log.warn("MethodArgumentNotValidException: {}", e.getMessage());
        List<ErrorResponse.FieldError> fieldErrors = e.getBindingResult().getFieldErrors().stream()
                .map(error -> new ErrorResponse.FieldError(
                        error.getField(),
                        error.getDefaultMessage()
                ))
                .toList();
        ErrorResponse response = ErrorResponse.of(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.", fieldErrors);
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolationException(ConstraintViolationException e) {
        log.warn("ConstraintViolationException: {}", e.getMessage());
        ErrorResponse response = ErrorResponse.of(HttpStatus.BAD_REQUEST, e.getMessage());
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException e) {
        log.warn("AccessDeniedException: {}", e.getMessage());
        ErrorResponse response = ErrorResponse.of(HttpStatus.FORBIDDEN, "접근 권한이 없습니다.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthenticationException e) {
        log.warn("AuthenticationException: {}", e.getMessage());
        ErrorResponse response = ErrorResponse.of(HttpStatus.UNAUTHORIZED, "인증이 필요합니다.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("Unhandled exception", e);
        ErrorResponse response = ErrorResponse.of(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
