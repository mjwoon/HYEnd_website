package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    public enum Role {
        STUDENT, STAFF, ADMIN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String department;

    private String studentId;

    @Column(nullable = false)
    private boolean isActive = true;

    public static User of(String email, String password, String name, Role role) {
        User user = new User();
        user.email = email;
        user.password = password;
        user.name = name;
        user.role = role;
        user.isActive = true;
        return user;
    }
}
