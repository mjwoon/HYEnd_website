package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.meeting.*;
import com.hyend.security.UserPrincipal;
import com.hyend.service.MeetingRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingRoomService meetingRoomService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MeetingRoomResponse> create(
            @Valid @RequestBody MeetingRoomRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(meetingRoomService.create(request, principal.getId()));
    }

    @GetMapping
    public ApiResponse<List<MeetingRoomSummary>> getList() {
        return ApiResponse.ok(meetingRoomService.getList());
    }

    @GetMapping("/{id}")
    public ApiResponse<MeetingRoomResponse> getDetail(@PathVariable Long id) {
        return ApiResponse.ok(meetingRoomService.getDetail(id));
    }

    @PostMapping("/{id}/join")
    public ApiResponse<JoinMeetingResponse> join(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(meetingRoomService.join(id, principal.getId()));
    }

    @PostMapping("/{id}/leave")
    public ApiResponse<Void> leave(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        meetingRoomService.leave(id, principal.getId());
        return ApiResponse.ok(null);
    }

    @PostMapping("/{id}/end")
    public ApiResponse<Void> end(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        meetingRoomService.end(id, principal.getId());
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        meetingRoomService.delete(id, principal.getId());
        return ApiResponse.ok(null);
    }
}
