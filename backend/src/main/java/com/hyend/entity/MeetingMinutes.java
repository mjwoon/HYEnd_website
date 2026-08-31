package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_minutes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MeetingMinutes {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false, unique = true)
    private MeetingRoom room;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false)
    private boolean isEdited = false;

    @Column(nullable = false)
    private LocalDateTime generatedAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public static MeetingMinutes of(MeetingRoom room, String content) {
        MeetingMinutes m = new MeetingMinutes();
        m.room = room;
        m.content = content;
        m.isEdited = false;
        m.generatedAt = LocalDateTime.now();
        m.updatedAt = LocalDateTime.now();
        return m;
    }

    public void update(String content) {
        this.content = content;
        this.isEdited = true;
        this.updatedAt = LocalDateTime.now();
    }

    public void regenerate(String content) {
        this.content = content;
        this.updatedAt = LocalDateTime.now();
    }
}
