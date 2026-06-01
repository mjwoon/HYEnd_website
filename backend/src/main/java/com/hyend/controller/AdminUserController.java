package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.common.PageResponse;
import com.hyend.dto.user.UserResponse;
import com.hyend.dto.user.UserRoleRequest;
import com.hyend.entity.User;
import com.hyend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin - User", description = "관리자 전용 유저 관리 API")
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AdminUserController {

    private final UserService userService;

    @Operation(summary = "유저 목록 조회", description = "ADMIN만 사용 가능. role, keyword(이름/이메일)로 필터링 가능.")
    @GetMapping
    public ApiResponse<PageResponse<UserResponse>> getUsers(
            @Parameter(description = "역할 필터 (STUDENT / STAFF / ADMIN)") @RequestParam(required = false) User.Role role,
            @Parameter(description = "이름 또는 이메일 검색") @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.ok(PageResponse.of(userService.getUsers(role, keyword, pageable)));
    }

    @Operation(summary = "유저 역할 변경", description = "ADMIN만 사용 가능. STUDENT / STAFF / ADMIN 중 하나로 변경.")
    @PatchMapping("/{userId}/role")
    public ApiResponse<UserResponse> updateRole(
            @PathVariable Long userId,
            @Valid @RequestBody UserRoleRequest request
    ) {
        return ApiResponse.ok(userService.updateRole(userId, request.role()));
    }
}
