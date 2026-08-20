package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_participants")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MeetingParticipant {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private MeetingRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();

    private LocalDateTime leftAt;

    public static MeetingParticipant of(MeetingRoom room, User user) {
        MeetingParticipant p = new MeetingParticipant();
        p.room = room;
        p.user = user;
        p.joinedAt = LocalDateTime.now();
        return p;
    }

    public void leave() { this.leftAt = LocalDateTime.now(); }

    public boolean hasLeft() { return this.leftAt != null; }
}
