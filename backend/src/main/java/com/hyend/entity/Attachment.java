package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "attachments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Attachment extends BaseTimeEntity {

    public enum EntityType {
        ANNOUNCEMENT, INQUIRY, EVENT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false)
    private String storedFilename;

    @Column(nullable = false)
    private String fileUrl;

    @Column(nullable = false)
    private Long fileSize;

    @Column(nullable = false)
    private String contentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntityType entityType;

    @Column(nullable = false)
    private Long entityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_id", nullable = false)
    private User uploadedBy;

    public static Attachment of(String originalFilename, String storedFilename, String fileUrl,
                                Long fileSize, String contentType, EntityType entityType,
                                Long entityId, User uploadedBy) {
        Attachment attachment = new Attachment();
        attachment.originalFilename = originalFilename;
        attachment.storedFilename = storedFilename;
        attachment.fileUrl = fileUrl;
        attachment.fileSize = fileSize;
        attachment.contentType = contentType;
        attachment.entityType = entityType;
        attachment.entityId = entityId;
        attachment.uploadedBy = uploadedBy;
        return attachment;
    }
}
