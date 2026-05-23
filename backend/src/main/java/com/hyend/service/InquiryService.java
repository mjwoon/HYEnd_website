package com.hyend.service;

import com.hyend.dto.inquiry.InquiryRequest;
import com.hyend.dto.inquiry.InquiryResponse;
import com.hyend.dto.inquiry.ReplyRequest;
import com.hyend.dto.inquiry.ReplyResponse;
import com.hyend.entity.Inquiry;
import com.hyend.entity.InquiryReply;
import com.hyend.entity.User;
import com.hyend.repository.InquiryReplyRepository;
import com.hyend.repository.InquiryRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;

// TODO [H-8] 문의 서비스 구현
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InquiryService {
    private final InquiryRepository inquiryRepository;
    private final InquiryReplyRepository replyRepository;
    private final UserRepository userRepository;

    // 조회

    public InquiryResponse getInquiry(Long inquiryId, Long requesterId) {
        Inquiry inquiry = findInquiry(inquiryId);
        validateReadPermission(inquiry, requesterId);
        return toResponse(inquiry);
    }

    public List<InquiryResponse> getMyInquiries(Long userId, Pageable pageable) {

        return inquiryRepository.findByAuthorId(userId, pageable)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // 생성
    @Transactional
    public InquiryResponse createInquiry(InquiryRequest request, Long authorId) {
        User author = findUser(authorId);

        Inquiry inquiry = Inquiry.of(
                request.title(),
                request.content(),
                author,
                request.isPrivate()
        );

        Inquiry saved = inquiryRepository.save(inquiry);
        return toResponse(saved);
    }

    // 수정

    @Transactional
    public InquiryResponse updateInquiry(Long inquiryId, InquiryRequest request, Long requesterId) {
        Inquiry inquiry = findInquiry(inquiryId);

        validateOwner(inquiry, requesterId);
        validateOpen(inquiry);

        inquiry.update(request.title(), request.content());

        return toResponse(inquiry);
    }

    // 삭제

    @Transactional
    public void deleteInquiry(Long inquiryId, Long requesterId) {
        Inquiry inquiry = findInquiry(inquiryId);

        validateOwner(inquiry, requesterId);
        validateOpen(inquiry);

        inquiryRepository.delete(inquiry);
    }

    // 종료

    @Transactional
    public void closeInquiry(Long inquiryId) {
        Inquiry inquiry = findInquiry(inquiryId);

        validateOpen(inquiry);
        inquiry.close();
    }

    // 답변 조회

    public List<ReplyResponse> getReplies(Long inquiryId, Long requesterId) {
        Inquiry inquiry = findInquiry(inquiryId);

        validateReadPermission(inquiry, requesterId);

        return replyRepository.findByInquiryIdOrderByCreatedAtAsc(inquiryId)
                .stream()
                .map(this::toReplyResponse)
                .toList();
    }

    // ── 답변 생성 ─────────────────────────────────────────────

    @Transactional
    public ReplyResponse createReply(Long inquiryId, ReplyRequest request, Long authorId) {
        Inquiry inquiry = findInquiry(inquiryId);
        User author = findUser(authorId);

        InquiryReply reply = InquiryReply.of(inquiry, author, request.content());

        return toReplyResponse(replyRepository.save(reply));
    }

    // 필요 메서드

    private Inquiry findInquiry(Long id) {
        return inquiryRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("문의를 찾을 수 없습니다.")
                );
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("사용자를 찾을 수 없습니다.")
                );
    }

    // DTO 변환
    private InquiryResponse toResponse(Inquiry inquiry) {
        return new InquiryResponse(
                inquiry.getId(),
                inquiry.getTitle(),
                inquiry.getContent(),
                inquiry.getAuthor().getName(),
                inquiry.getStatus().name()
        );
    }

    private ReplyResponse toReplyResponse(InquiryReply reply) {
        return new ReplyResponse(
                reply.getId(),
                reply.getContent(),
                reply.getAuthor().getName(),
                reply.getCreatedAt()
        );
    }

    // 검증

    private void validateOwner(Inquiry inquiry, Long requesterId) {
        if (!inquiry.getAuthor().getId().equals(requesterId)) {
            throw new IllegalArgumentException("본인의 문의만 수정/삭제할 수 있습니다.");
        }
    }

    private void validateOpen(Inquiry inquiry) {
        if (inquiry.getStatus() == Inquiry.InquiryStatus.CLOSED) {
            throw new IllegalStateException("종료된 문의는 수정/삭제할 수 없습니다.");
        }
    }

    private void validateReadPermission(Inquiry inquiry, Long requesterId) {
        if (inquiry.isPrivate() &&
                !inquiry.getAuthor().getId().equals(requesterId)) {
            throw new IllegalArgumentException("비공개 문의에 접근할 수 없습니다.");
        }
    }
}