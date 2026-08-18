package com.hyend.dto.user;

import com.hyend.entity.User;

public record UserResponse(
        Long id,
        String email,
        String name,
        User.Role role,
        boolean isActive
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.isActive()
        );
    }
}
