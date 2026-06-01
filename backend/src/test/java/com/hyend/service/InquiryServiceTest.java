package com.hyend.service;

import com.hyend.dto.inquiry.InquiryRequest;
import com.hyend.entity.Inquiry;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.InquiryReplyRepository;
import com.hyend.repository.InquiryRepository;
import com.hyend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class InquiryServiceTest {

    @Mock InquiryRepository inquiryRepository;
    @Mock InquiryReplyRepository replyRepository;
    @Mock UserRepository userRepository;
    @InjectMocks InquiryService inquiryService;

    @Test
    @DisplayName("공개 문의 조회 - 성공")
    void getInquiry_public_success() {
        Inquiry inquiry = mock(Inquiry.class);
        User requester = mock(User.class);

        given(inquiryRepository.findById(1L)).willReturn(Optional.of(inquiry));
        given(userRepository.findById(1L)).willReturn(Optional.of(requester));
        given(inquiry.isPrivate()).willReturn(false);
        given(inquiry.getAuthor()).willReturn(mock(User.class));
        given(inquiry.getStatus()).willReturn(Inquiry.InquiryStatus.OPEN);

        assertThatCode(() -> inquiryService.getInquiry(1L, 1L)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("비공개 문의 조회 - 본인 성공")
    void getInquiry_private_ownerSuccess() {
        Inquiry inquiry = mock(Inquiry.class);
        User owner = mock(User.class);

        given(inquiryRepository.findById(1L)).willReturn(Optional.of(inquiry));
        given(userRepository.findById(1L)).willReturn(Optional.of(owner));
        given(inquiry.isPrivate()).willReturn(true);
        given(inquiry.getAuthor()).willReturn(owner);
        given(owner.getId()).willReturn(1L);
        given(inquiry.getStatus()).willReturn(Inquiry.InquiryStatus.OPEN);

        assertThatCode(() -> inquiryService.getInquiry(1L, 1L)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("비공개 문의 조회 - 타인 실패")
    void getInquiry_private_nonOwnerFails() {
        Inquiry inquiry = mock(Inquiry.class);
        User owner = mock(User.class);
        User stranger = mock(User.class);

        given(inquiryRepository.findById(1L)).willReturn(Optional.of(inquiry));
        given(userRepository.findById(2L)).willReturn(Optional.of(stranger));
        given(inquiry.isPrivate()).willReturn(true);
        given(inquiry.getAuthor()).willReturn(owner);
        given(owner.getId()).willReturn(1L);
        given(stranger.getId()).willReturn(2L);
        given(stranger.getRole()).willReturn(User.Role.STUDENT);

        assertThatThrownBy(() -> inquiryService.getInquiry(1L, 2L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("비공개 문의 조회 - STAFF 허용")
    void getInquiry_private_staffAllowed() {
        Inquiry inquiry = mock(Inquiry.class);
        User owner = mock(User.class);
        User staff = mock(User.class);

        given(inquiryRepository.findById(1L)).willReturn(Optional.of(inquiry));
        given(userRepository.findById(2L)).willReturn(Optional.of(staff));
        given(inquiry.isPrivate()).willReturn(true);
        given(inquiry.getAuthor()).willReturn(owner);
        given(owner.getId()).willReturn(1L);
        given(staff.getId()).willReturn(2L);
        given(staff.getRole()).willReturn(User.Role.STAFF);
        given(inquiry.getStatus()).willReturn(Inquiry.InquiryStatus.OPEN);

        assertThatCode(() -> inquiryService.getInquiry(1L, 2L)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("문의 생성 - 성공")
    void createInquiry_success() {
        InquiryRequest request = new InquiryRequest("제목", "내용", "일반", false);
        User author = mock(User.class);

        given(userRepository.findById(1L)).willReturn(Optional.of(author));
        given(inquiryRepository.save(any(Inquiry.class))).willAnswer(i -> i.getArgument(0));
        given(author.getName()).willReturn("작성자");

        assertThatCode(() -> inquiryService.createInquiry(request, 1L)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("문의 종료 - 성공")
    void closeInquiry_success() {
        Inquiry inquiry = mock(Inquiry.class);
        given(inquiryRepository.findById(1L)).willReturn(Optional.of(inquiry));
        given(inquiry.getStatus()).willReturn(Inquiry.InquiryStatus.OPEN);

        assertThatCode(() -> inquiryService.closeInquiry(1L)).doesNotThrowAnyException();
        then(inquiry).should().close();
    }

    @Test
    @DisplayName("문의 종료 - 이미 종료됨")
    void closeInquiry_alreadyClosed() {
        Inquiry inquiry = mock(Inquiry.class);
        given(inquiryRepository.findById(1L)).willReturn(Optional.of(inquiry));
        given(inquiry.getStatus()).willReturn(Inquiry.InquiryStatus.CLOSED);

        assertThatThrownBy(() -> inquiryService.closeInquiry(1L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("문의 수정 - 타인 실패")
    void updateInquiry_nonOwnerFails() {
        Inquiry inquiry = mock(Inquiry.class);
        User owner = mock(User.class);

        given(inquiryRepository.findById(1L)).willReturn(Optional.of(inquiry));
        given(inquiry.getAuthor()).willReturn(owner);
        given(owner.getId()).willReturn(1L);

        InquiryRequest request = new InquiryRequest("수정", "내용", "일반", false);

        assertThatThrownBy(() -> inquiryService.updateInquiry(1L, request, 2L))
                .isInstanceOf(BusinessException.class);
    }
}
