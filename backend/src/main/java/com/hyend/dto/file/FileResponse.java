package com.hyend.dto.file;

// 파일 업로드 응답 DTO
public record FileResponse(
        String originalFilename,
        String storedFilename,
        String fileUrl,
        long size,
        String contentType
) {
}
