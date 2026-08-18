package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_transcripts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MeetingTranscript {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private MeetingRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "speaker_user_id")
    private User speaker;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    @Column(nullable = false)
    private int chunkIndex;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public static MeetingTranscript of(MeetingRoom room, User speaker, String text, int chunkIndex) {
        MeetingTranscript t = new MeetingTranscript();
        t.room = room;
        t.speaker = speaker;
        t.text = text;
        t.chunkIndex = chunkIndex;
        t.createdAt = LocalDateTime.now();
        return t;
    }
}
