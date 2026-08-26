package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "inquiries")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inquiry extends BaseTimeEntity {

    public enum InquiryStatus {
        OPEN, CLOSED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false)
    private boolean isPrivate = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InquiryStatus status = InquiryStatus.OPEN;

    public static Inquiry of(String title, String content, User author, boolean isPrivate) {
        Inquiry inquiry = new Inquiry();
        inquiry.title = title;
        inquiry.content = content;
        inquiry.author = author;
        inquiry.isPrivate = isPrivate;
        inquiry.status = InquiryStatus.OPEN;
        return inquiry;
    }

    public void update(String title, String content) {
        this.title = title;
        this.content = content;
    }

    public void close() {
        this.status = InquiryStatus.CLOSED;
    }
}
