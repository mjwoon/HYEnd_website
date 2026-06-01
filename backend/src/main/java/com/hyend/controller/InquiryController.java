package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.inquiry.InquiryRequest;
import com.hyend.dto.inquiry.InquiryResponse;
import com.hyend.dto.inquiry.ReplyRequest;
import com.hyend.dto.inquiry.ReplyResponse;
import com.hyend.security.UserPrincipal;
import com.hyend.service.InquiryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Inquiries", description = "문의 API")
@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class InquiryController {

    private final InquiryService inquiryService;

    @Operation(summary = "문의 단건 조회")
    @GetMapping("/{inquiryId}")
    public ApiResponse<InquiryResponse> getInquiry(
            @PathVariable Long inquiryId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.ok(inquiryService.getInquiry(inquiryId, principal.getId()));
    }

    @Operation(summary = "내 문의 목록 조회")
    @GetMapping("/me")
    public ApiResponse<List<InquiryResponse>> getMyInquiries(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.ok(inquiryService.getMyInquiries(principal.getId(), pageable));
    }

    @Operation(summary = "문의 생성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InquiryResponse> createInquiry(
            @RequestBody @Valid InquiryRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.ok(inquiryService.createInquiry(request, principal.getId()));
    }

    @Operation(summary = "문의 수정")
    @PutMapping("/{inquiryId}")
    public ApiResponse<InquiryResponse> updateInquiry(
            @PathVariable Long inquiryId,
            @RequestBody @Valid InquiryRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.ok(inquiryService.updateInquiry(inquiryId, request, principal.getId()));
    }

    @Operation(summary = "문의 삭제")
    @DeleteMapping("/{inquiryId}")
    public ApiResponse<Void> deleteInquiry(
            @PathVariable Long inquiryId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        inquiryService.deleteInquiry(inquiryId, principal.getId());
        return ApiResponse.ok("문의가 삭제되었습니다.");
    }

    @Operation(summary = "문의 종료")
    @PatchMapping("/{inquiryId}/close")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ApiResponse<Void> closeInquiry(@PathVariable Long inquiryId) {
        inquiryService.closeInquiry(inquiryId);
        return ApiResponse.ok("문의가 종료되었습니다.");
    }

    @Operation(summary = "답변 목록 조회")
    @GetMapping("/{inquiryId}/replies")
    public ApiResponse<List<ReplyResponse>> getReplies(
            @PathVariable Long inquiryId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.ok(inquiryService.getReplies(inquiryId, principal.getId()));
    }

    @Operation(summary = "답변 생성")
    @PostMapping("/{inquiryId}/replies")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ApiResponse<ReplyResponse> createReply(
            @PathVariable Long inquiryId,
            @RequestBody @Valid ReplyRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.ok(inquiryService.createReply(inquiryId, request, principal.getId()));
    }
}
