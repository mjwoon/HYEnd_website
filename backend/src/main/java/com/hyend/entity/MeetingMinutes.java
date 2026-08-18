package com.hyend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_minutes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class MeetingMinutes {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false, unique = true)
    private MeetingRoom room;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private LocalDateTime generatedAt;

    @PrePersist
    void prePersist() {
        generatedAt = LocalDateTime.now();
    }
}
