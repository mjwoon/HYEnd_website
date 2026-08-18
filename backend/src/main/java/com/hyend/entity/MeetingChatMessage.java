package com.hyend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_chat_messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class MeetingChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private MeetingRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Type type = Type.TEXT;

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public enum Type { TEXT }
    @Column(columnDefinition = "TEXT")
    private String fileUrl;

    @Column(length = 255)
    private String fileName;

    private Long fileSize;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public static MeetingChatMessage text(MeetingRoom room, User user, String content) {
        MeetingChatMessage m = new MeetingChatMessage();
        m.room = room;
        m.user = user;
        m.type = Type.TEXT;
        m.content = content;
        m.createdAt = LocalDateTime.now();
        return m;
    }

    public static MeetingChatMessage file(MeetingRoom room, User user, String fileUrl, String fileName, Long fileSize) {
        MeetingChatMessage m = new MeetingChatMessage();
        m.room = room;
        m.user = user;
        m.type = Type.FILE;
        m.fileUrl = fileUrl;
        m.fileName = fileName;
        m.fileSize = fileSize;
        m.createdAt = LocalDateTime.now();
        return m;
    }
}
