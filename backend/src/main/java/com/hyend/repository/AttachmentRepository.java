package com.hyend.repository;

import com.hyend.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByEntityTypeAndEntityId(Attachment.EntityType entityType, Long entityId);

    void deleteByEntityTypeAndEntityId(Attachment.EntityType entityType, Long entityId);
}
