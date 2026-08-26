package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Event extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String location;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    public static Event of(String title, String description, String location,
                           LocalDateTime startTime, LocalDateTime endTime, User author) {
        Event event = new Event();
        event.title = title;
        event.description = description;
        event.location = location;
        event.startTime = startTime;
        event.endTime = endTime;
        event.author = author;
        return event;
    }

    public void update(String title, String description, String location,
                       LocalDateTime startTime, LocalDateTime endTime) {
        this.title = title;
        this.description = description;
        this.location = location;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}
