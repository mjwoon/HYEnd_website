package com.hyend.dto.file;

public record FileResponse(
        String originalFilename,
        String storedFilename,
        String fileUrl,
        long fileSize,
        String contentType
) {}
