package com.hyend.entity;

import com.hyend.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_rooms")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MeetingRoom extends BaseTimeEntity {

    public enum Status { WAITING, ACTIVE, ENDED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_user_id", nullable = false)
    private User host;

    @Column(nullable = false, unique = true, length = 64)
    private String livekitRoomName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status = Status.WAITING;

    private LocalDateTime endedAt;

    public static MeetingRoom of(String title, String description, User host, String livekitRoomName) {
        MeetingRoom room = new MeetingRoom();
        room.title = title;
        room.description = description;
        room.host = host;
        room.livekitRoomName = livekitRoomName;
        room.status = Status.WAITING;
        return room;
    }

    public void activate() { this.status = Status.ACTIVE; }

    public void end() {
        this.status = Status.ENDED;
        this.endedAt = LocalDateTime.now();
    }

    public boolean isHost(Long userId) { return this.host.getId().equals(userId); }

    public boolean isEnded() { return this.status == Status.ENDED; }
}
