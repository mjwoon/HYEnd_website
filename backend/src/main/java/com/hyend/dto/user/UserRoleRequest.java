package com.hyend.dto.user;

import com.hyend.entity.User;
import jakarta.validation.constraints.NotNull;

public record UserRoleRequest(
        @NotNull User.Role role
) {}
