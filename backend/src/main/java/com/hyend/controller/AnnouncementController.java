package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.common.PageResponse;
import com.hyend.dto.announcement.AnnouncementRequest;
import com.hyend.dto.announcement.AnnouncementResponse;
import com.hyend.dto.announcement.AnnouncementSummary;
import com.hyend.security.UserPrincipal;
import com.hyend.service.AnnouncementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Announcements", description = "공지사항 API")
@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @Operation(summary = "공지사항 목록 조회")
    @GetMapping
    public ApiResponse<PageResponse<AnnouncementSummary>> getList(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        if (keyword != null && !keyword.isBlank()) {
            return ApiResponse.ok(PageResponse.of(announcementService.search(keyword, pageable)));
        }
        if (categoryId != null) {
            return ApiResponse.ok(PageResponse.of(announcementService.getByCategory(categoryId, pageable)));
        }
        return ApiResponse.ok(PageResponse.of(announcementService.getList(pageable)));
    }

    @Operation(summary = "핀 고정 공지사항 목록")
    @GetMapping("/pinned")
    public ApiResponse<List<AnnouncementSummary>> getPinned() {
        return ApiResponse.ok(announcementService.getPinned());
    }

    @Operation(summary = "공지사항 상세 조회")
    @GetMapping("/{id}")
    public ApiResponse<AnnouncementResponse> getDetail(@PathVariable Long id) {
        return ApiResponse.ok(announcementService.getDetail(id));
    }

    @Operation(summary = "공지사항 작성")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AnnouncementResponse> create(
            @Valid @RequestBody AnnouncementRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.ok(announcementService.create(request, principal.getId()));
    }

    @Operation(summary = "공지사항 수정")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/{id}")
    public ApiResponse<AnnouncementResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody AnnouncementRequest request
    ) {
        return ApiResponse.ok(announcementService.update(id, request));
    }

    @Operation(summary = "공지사항 삭제")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        announcementService.delete(id);
        return ApiResponse.ok("공지사항이 삭제되었습니다.");
    }

    @Operation(summary = "공지사항 핀 고정")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/{id}/pin")
    public ApiResponse<Void> pin(@PathVariable Long id) {
        announcementService.pin(id);
        return ApiResponse.ok("공지사항이 고정되었습니다.");
    }

    @Operation(summary = "공지사항 핀 해제")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/{id}/unpin")
    public ApiResponse<Void> unpin(@PathVariable Long id) {
        announcementService.unpin(id);
        return ApiResponse.ok("공지사항 고정이 해제되었습니다.");
    }
}
