package com.hyend.controller;

import com.hyend.dto.inquiry.InquiryRequest;
import com.hyend.dto.inquiry.InquiryResponse;
import com.hyend.dto.inquiry.ReplyRequest;
import com.hyend.dto.inquiry.ReplyResponse;
import com.hyend.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// TODO [H-8] 문의 컨트롤러 구현
@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    // 문의 단건 조회
    @GetMapping("/{inquiryId}")
    public ResponseEntity<InquiryResponse> getInquiry(
            @PathVariable Long inquiryId,
            @RequestParam Long requesterId
    ) {
        return ResponseEntity.ok(
                inquiryService.getInquiry(inquiryId, requesterId)
        );
    }

    // 내 문의 목록 조회
    @GetMapping("/me")
    public ResponseEntity<List<InquiryResponse>> getMyInquiries(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);

        return ResponseEntity.ok(
                inquiryService.getMyInquiries(userId, pageable)
        );
    }

    // 문의 생성
    @PostMapping
    public ResponseEntity<InquiryResponse> createInquiry(
            @RequestBody @Valid InquiryRequest request,
            @RequestParam Long authorId
    ) {
        return ResponseEntity.ok(
                inquiryService.createInquiry(request, authorId)
        );
    }

    // 문의 수정
    @PutMapping("/{inquiryId}")
    public ResponseEntity<InquiryResponse> updateInquiry(
            @PathVariable Long inquiryId,
            @RequestBody @Valid InquiryRequest request,
            @RequestParam Long requesterId
    ) {
        return ResponseEntity.ok(
                inquiryService.updateInquiry(inquiryId, request, requesterId)
        );
    }

    // 문의 삭제
    @DeleteMapping("/{inquiryId}")
    public ResponseEntity<Void> deleteInquiry(
            @PathVariable Long inquiryId,
            @RequestParam Long requesterId
    ) {
        inquiryService.deleteInquiry(inquiryId, requesterId);

        return ResponseEntity.noContent().build();
    }

    // 문의 종료
    @PatchMapping("/{inquiryId}/close")
    public ResponseEntity<Void> closeInquiry(
            @PathVariable Long inquiryId
    ) {
        inquiryService.closeInquiry(inquiryId);

        return ResponseEntity.ok().build();
    }

    // 답변 목록 조회
    @GetMapping("/{inquiryId}/replies")
    public ResponseEntity<List<ReplyResponse>> getReplies(
            @PathVariable Long inquiryId,
            @RequestParam Long requesterId
    ) {
        return ResponseEntity.ok(
                inquiryService.getReplies(inquiryId, requesterId)
        );
    }

    // 답변 생성
    @PostMapping("/{inquiryId}/replies")
    public ResponseEntity<ReplyResponse> createReply(
            @PathVariable Long inquiryId,
            @RequestBody @Valid ReplyRequest request,
            @RequestParam Long authorId
    ) {
        return ResponseEntity.ok(
                inquiryService.createReply(inquiryId, request, authorId)
        );
    }
}
