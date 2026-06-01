package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.file.AttachmentResponse;
import com.hyend.dto.inquiry.InquiryRequest;
import com.hyend.dto.inquiry.InquiryResponse;
import com.hyend.dto.inquiry.ReplyRequest;
import com.hyend.dto.inquiry.ReplyResponse;
import com.hyend.entity.Attachment;
import com.hyend.entity.Inquiry;
import com.hyend.entity.InquiryReply;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.InquiryReplyRepository;
import com.hyend.repository.InquiryRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InquiryService {
    private final InquiryRepository inquiryRepository;
    private final InquiryReplyRepository replyRepository;
    private final UserRepository userRepository;
    private final AttachmentService attachmentService;

    public InquiryResponse getInquiry(Long inquiryId, Long requesterId) {
        Inquiry inquiry = findInquiry(inquiryId);
        User requester = findUser(requesterId);
        validateReadPermission(inquiry, requester);
        return toResponse(inquiry);
    }

    public List<InquiryResponse> getMyInquiries(Long userId, Pageable pageable) {
        return inquiryRepository.findByAuthorId(userId, pageable)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public InquiryResponse createInquiry(InquiryRequest request, Long authorId) {
        User author = findUser(authorId);
        Inquiry inquiry = Inquiry.of(request.title(), request.content(), author, request.isPrivate());
        return toResponse(inquiryRepository.save(inquiry));
    }

    @Transactional
    public InquiryResponse updateInquiry(Long inquiryId, InquiryRequest request, Long requesterId) {
        Inquiry inquiry = findInquiry(inquiryId);
        validateOwner(inquiry, requesterId);
        validateOpen(inquiry);
        inquiry.update(request.title(), request.content());
        return toResponse(inquiry);
    }

    @Transactional
    public void deleteInquiry(Long inquiryId, Long requesterId) {
        Inquiry inquiry = findInquiry(inquiryId);
        validateOwner(inquiry, requesterId);
        validateOpen(inquiry);
        attachmentService.deleteByEntity(Attachment.EntityType.INQUIRY, inquiryId);
        inquiryRepository.delete(inquiry);
    }

    public List<AttachmentResponse> getAttachments(Long inquiryId, Long requesterId) {
        Inquiry inquiry = findInquiry(inquiryId);
        User requester = findUser(requesterId);
        validateReadPermission(inquiry, requester);
        return attachmentService.findByEntity(Attachment.EntityType.INQUIRY, inquiryId);
    }

    @Transactional
    public void closeInquiry(Long inquiryId) {
        Inquiry inquiry = findInquiry(inquiryId);
        validateOpen(inquiry);
        inquiry.close();
    }

    public List<ReplyResponse> getReplies(Long inquiryId, Long requesterId) {
        Inquiry inquiry = findInquiry(inquiryId);
        User requester = findUser(requesterId);
        validateReadPermission(inquiry, requester);
        return replyRepository.findByInquiryIdOrderByCreatedAtAsc(inquiryId)
                .stream()
                .map(this::toReplyResponse)
                .toList();
    }

    @Transactional
    public ReplyResponse createReply(Long inquiryId, ReplyRequest request, Long authorId) {
        Inquiry inquiry = findInquiry(inquiryId);
        User author = findUser(authorId);
        return toReplyResponse(replyRepository.save(InquiryReply.of(inquiry, author, request.content())));
    }

    private Inquiry findInquiry(Long id) {
        return inquiryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

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

    private void validateOwner(Inquiry inquiry, Long requesterId) {
        if (!inquiry.getAuthor().getId().equals(requesterId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
    }

    private void validateOpen(Inquiry inquiry) {
        if (inquiry.getStatus() == Inquiry.InquiryStatus.CLOSED) {
            throw new BusinessException(ErrorCode.INQUIRY_ALREADY_CLOSED);
        }
    }

    private void validateReadPermission(Inquiry inquiry, User requester) {
        if (!inquiry.isPrivate()) return;
        if (inquiry.getAuthor().getId().equals(requester.getId())) return;
        if (requester.getRole() == User.Role.STAFF || requester.getRole() == User.Role.ADMIN) return;
        throw new BusinessException(ErrorCode.PRIVATE_INQUIRY);
    }
}
