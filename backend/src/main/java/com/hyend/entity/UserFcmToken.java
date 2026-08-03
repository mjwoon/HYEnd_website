package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_fcm_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserFcmToken {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, columnDefinition = "TEXT")
    private String token;

    @Column(length = 255)
    private String userAgent;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime lastUsedAt;

    public static UserFcmToken of(User user, String token, String userAgent) {
        UserFcmToken t = new UserFcmToken();
        t.user = user;
        t.token = token;
        t.userAgent = userAgent;
        t.createdAt = LocalDateTime.now();
        t.lastUsedAt = LocalDateTime.now();
        return t;
    }

    public void refreshLastUsed() {
        this.lastUsedAt = LocalDateTime.now();
    }
}
