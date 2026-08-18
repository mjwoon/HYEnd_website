package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.common.PageResponse;
import com.hyend.dto.scrap.ScrapResponse;
import com.hyend.security.UserPrincipal;
import com.hyend.service.ScrapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Scraps", description = "스크랩 API")
@RestController
@RequestMapping("/api/scraps")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class ScrapController {

    private final ScrapService scrapService;

    @Operation(summary = "내 스크랩 목록")
    @GetMapping
    public ApiResponse<PageResponse<ScrapResponse>> getMyScraps(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.ok(PageResponse.of(scrapService.getMyScraps(principal.getId(), pageable)));
    }

    @Operation(summary = "스크랩 추가")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ScrapResponse> scrap(
            @RequestParam Long postId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.ok(scrapService.scrap(postId, principal.getId()));
    }

    @Operation(summary = "스크랩 삭제")
    @DeleteMapping("/{scrapId}")
    public ApiResponse<Void> unscrap(
            @PathVariable Long scrapId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        scrapService.unscrap(scrapId, principal.getId());
        return ApiResponse.ok("스크랩이 삭제되었습니다.");
    }
}
