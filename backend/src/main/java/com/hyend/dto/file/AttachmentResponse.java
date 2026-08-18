package com.hyend.dto.file;

import com.hyend.entity.Attachment;

public record AttachmentResponse(
        Long id,
        String originalFilename,
        String fileUrl,
        Long fileSize,
        String contentType
) {
    public static AttachmentResponse from(Attachment attachment) {
        return new AttachmentResponse(
                attachment.getId(),
                attachment.getOriginalFilename(),
                attachment.getFileUrl(),
                attachment.getFileSize(),
                attachment.getContentType()
        );
    }
}
