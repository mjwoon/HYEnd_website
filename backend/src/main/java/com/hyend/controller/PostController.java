package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.common.PageResponse;
import com.hyend.dto.post.PostRequest;
import com.hyend.dto.post.PostResponse;
import com.hyend.dto.post.PostSummary;
import com.hyend.entity.Post;
import com.hyend.security.UserPrincipal;
import com.hyend.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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

@Tag(name = "Posts", description = "공모전/제출/자유게시판 API")
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @Operation(summary = "게시글 목록 조회", description = "boardType: CONTEST(공모전) / SUBMISSION(제출) / FREE(자유게시판)")
    @GetMapping
    public ApiResponse<PageResponse<PostSummary>> getList(
            @Parameter(description = "게시판 종류", required = true) @RequestParam Post.BoardType boardType,
            @Parameter(description = "제목/내용 검색") @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.ok(PageResponse.of(postService.getList(boardType, keyword, pageable)));
    }

    @Operation(summary = "게시글 상세 조회")
    @GetMapping("/{id}")
    public ApiResponse<PostResponse> getDetail(@PathVariable Long id) {
        return ApiResponse.ok(postService.getDetail(id));
    }

    @Operation(summary = "게시글 작성",
            description = "공모전: STAFF·ADMIN만 작성 가능 (SecurityConfig에서 제어). 제출·자유: 로그인 유저 누구나.")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PostResponse> create(
            @RequestParam Post.BoardType boardType,
            @Valid @RequestBody PostRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.ok(postService.create(boardType, request, principal.getId(), principal.getRole()));
    }

    @Operation(summary = "게시글 수정", description = "본인 작성글 또는 ADMIN만 수정 가능.")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/{id}")
    public ApiResponse<PostResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody PostRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.ok(postService.update(id, request, principal.getId(), principal.getRole()));
    }

    @Operation(summary = "게시글 삭제", description = "본인 작성글 또는 ADMIN만 삭제 가능.")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        postService.delete(id, principal.getId(), principal.getRole());
        return ApiResponse.ok("게시글이 삭제되었습니다.");
    }
}
