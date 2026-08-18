package com.hyend.service;

import com.hyend.dto.file.AttachmentResponse;
import com.hyend.dto.file.FileResponse;
import com.hyend.entity.Attachment;
import com.hyend.entity.User;
import com.hyend.repository.AttachmentRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;

    public List<AttachmentResponse> findByEntity(Attachment.EntityType entityType, Long entityId) {
        return attachmentRepository.findByEntityTypeAndEntityId(entityType, entityId)
                .stream()
                .map(AttachmentResponse::from)
                .toList();
    }

    @Transactional
    public AttachmentResponse save(FileResponse fileResponse, Attachment.EntityType entityType,
                                   Long entityId, Long uploaderId) {
        User uploader = userRepository.getReferenceById(uploaderId);
        Attachment attachment = Attachment.of(
                fileResponse.originalFilename(),
                fileResponse.storedFilename(),
                fileResponse.fileUrl(),
                fileResponse.size(),
                fileResponse.contentType(),
                entityType,
                entityId,
                uploader
        );
        return AttachmentResponse.from(attachmentRepository.save(attachment));
    }

    @Transactional
    public void deleteByEntity(Attachment.EntityType entityType, Long entityId) {
        attachmentRepository.deleteByEntityTypeAndEntityId(entityType, entityId);
    }
}
