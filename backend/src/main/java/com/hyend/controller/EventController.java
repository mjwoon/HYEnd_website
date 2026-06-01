package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.event.EventRequest;
import com.hyend.dto.event.EventResponse;
import com.hyend.security.UserPrincipal;
import com.hyend.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Events", description = "행사 API")
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;

    @Operation(summary = "행사 생성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<EventResponse> createEvent(
            @Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.ok(eventService.createEvent(principal.getId(), request));
    }

    @Operation(summary = "행사 목록 조회")
    @GetMapping
    public ApiResponse<List<EventResponse>> getAllEvents() {
        return ApiResponse.ok(eventService.getAllEvents());
    }

    @Operation(summary = "행사 단건 조회")
    @GetMapping("/{id}")
    public ApiResponse<EventResponse> getEvent(@PathVariable Long id) {
        return ApiResponse.ok(eventService.getEvent(id));
    }

    @Operation(summary = "행사 수정")
    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<EventResponse> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventRequest request
    ) {
        return ApiResponse.ok(eventService.updateEvent(id, request));
    }

    @Operation(summary = "행사 삭제")
    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<Void> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ApiResponse.ok("행사가 삭제되었습니다.");
    }
}
