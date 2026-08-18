package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.meeting.MinutesResponse;
import com.hyend.security.UserPrincipal;
import com.hyend.service.MinutesService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
public class MinutesController {

    private final MinutesService minutesService;

    @PostMapping("/{id}/minutes")
    public ApiResponse<MinutesResponse> generate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(minutesService.generate(id, principal.getId()));
    }

    @GetMapping("/{id}/minutes")
    public ApiResponse<MinutesResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(minutesService.getMinutes(id));
    }
}
