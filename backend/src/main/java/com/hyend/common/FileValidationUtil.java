package com.hyend.common;

import com.hyend.exception.BusinessException;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;
import java.util.UUID;

public class FileValidationUtil {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/x-hwp",
            "application/haansofthwp",
            "application/zip",
            "application/x-zip-compressed"
    );

    private FileValidationUtil() {}

    public static void validate(MultipartFile file, Set<String> allowedExtensions) {
        String ext = extractExtension(file.getOriginalFilename());
        if (!allowedExtensions.contains(ext)) {
            throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new BusinessException(ErrorCode.INVALID_FILE_EXTENSION);
        }
    }

    public static String generateStoredFilename(String originalFilename) {
        String ext = extractExtension(originalFilename);
        return UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);
    }

    public static String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
