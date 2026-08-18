package com.hyend.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // Common
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "잘못된 요청 파라미터입니다."),

    // Auth
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "만료된 토큰입니다."),
    REFRESH_TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "리프레시 토큰을 찾을 수 없습니다."),

    // Resource
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."),
    SCRAP_NOT_FOUND(HttpStatus.NOT_FOUND, "스크랩을 찾을 수 없습니다."),
    ALREADY_SCRAPPED(HttpStatus.CONFLICT, "이미 스크랩한 게시글입니다."),
    DUPLICATE_CATEGORY(HttpStatus.CONFLICT, "이미 존재하는 카테고리입니다."),
    ANNOUNCEMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다."),
    EVENT_NOT_FOUND(HttpStatus.NOT_FOUND, "행사를 찾을 수 없습니다."),
    BOOK_NOT_FOUND(HttpStatus.NOT_FOUND, "도서를 찾을 수 없습니다."),
    RENTAL_NOT_FOUND(HttpStatus.NOT_FOUND, "대출 내역을 찾을 수 없습니다."),
    INQUIRY_NOT_FOUND(HttpStatus.NOT_FOUND, "문의를 찾을 수 없습니다."),
    ATTACHMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "첨부파일을 찾을 수 없습니다."),
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "카테고리를 찾을 수 없습니다."),

    // Business
    BOOK_NOT_AVAILABLE(HttpStatus.CONFLICT, "대출 가능한 도서가 없습니다."),
    ALREADY_RENTED(HttpStatus.CONFLICT, "이미 대출 중인 도서입니다."),
    NOT_YOUR_RENTAL(HttpStatus.FORBIDDEN, "본인의 대출 내역이 아닙니다."),
    RENTAL_EXTEND_NOT_ALLOWED(HttpStatus.CONFLICT, "이미 연장했거나 연장 불가능한 대출입니다."),
    RENTAL_NOT_ACTIVE(HttpStatus.CONFLICT, "활성 상태가 아닌 대출입니다."),
    INQUIRY_ALREADY_CLOSED(HttpStatus.CONFLICT, "이미 종료된 문의입니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    PRIVATE_INQUIRY(HttpStatus.FORBIDDEN, "비공개 문의입니다."),

    // File
    INVALID_FILE_EXTENSION(HttpStatus.BAD_REQUEST, "허용되지 않는 파일 형식입니다."),
    FILE_SIZE_EXCEEDED(HttpStatus.BAD_REQUEST, "파일 크기가 초과되었습니다."),
    FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다."),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다."),
    FILE_DELETE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "파일 삭제에 실패했습니다."),

    // Meeting
    MEETING_NOT_FOUND(HttpStatus.NOT_FOUND, "회의방을 찾을 수 없습니다."),
    MEETING_ALREADY_ENDED(HttpStatus.CONFLICT, "이미 종료된 회의입니다."),
    MEETING_NOT_ACTIVE(HttpStatus.CONFLICT, "진행 중인 회의가 아닙니다."),
    NOT_MEETING_HOST(HttpStatus.FORBIDDEN, "회의 개설자만 이 작업을 수행할 수 있습니다."),
    ALREADY_IN_MEETING(HttpStatus.CONFLICT, "이미 회의에 참가 중입니다."),
    LIVEKIT_ROOM_CREATE_FAILED(HttpStatus.BAD_GATEWAY, "화상회의 서버 연동에 실패했습니다."),
    INVITE_NOT_FOUND(HttpStatus.NOT_FOUND, "초대 링크가 유효하지 않거나 만료됐습니다."),
    AI_QUOTA_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "AI 사용 할당량을 초과했습니다."),
    MINUTES_NOT_FOUND(HttpStatus.NOT_FOUND, "회의록을 찾을 수 없습니다."),

    // Server
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
