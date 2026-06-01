package com.hyend.service;

import com.hyend.dto.announcement.AnnouncementRequest;
import com.hyend.dto.announcement.AnnouncementResponse;
import com.hyend.entity.Announcement;
import com.hyend.entity.Category;
import com.hyend.entity.User;
import com.hyend.repository.AnnouncementRepository;
import com.hyend.repository.CategoryRepository;
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
class AnnouncementServiceTest {

    @Mock
    AnnouncementRepository announcementRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    CategoryRepository categoryRepository;

    @InjectMocks
    AnnouncementService announcementService;



    // 공지 생성

    @Test
    @DisplayName("공지사항 생성 - 성공")
    void createAnnouncement_success() {

        AnnouncementRequest request =
                new AnnouncementRequest(
                        "공지 제목",
                        "공지 내용",
                        "GENERAL",
                        true
                );

        User author = mock(User.class);

        given(userRepository.findById(1L))
                .willReturn(Optional.of(author));

        given(announcementRepository.save(any(Announcement.class)))
                .willAnswer(invocation -> invocation.getArgument(0));

        assertThatCode(() ->
                announcementService.create(request, 1L)
        ).doesNotThrowAnyException();

        then(announcementRepository)
                .should()
                .save(any(Announcement.class));
    }

    // 공지 생성 실패

    @Test
    @DisplayName("공지사항 생성 - 사용자 없음")
    void createAnnouncement_userNotFound() {

        AnnouncementRequest request =
                new AnnouncementRequest(
                        "공지 제목",
                        "공지 내용",
                        "GENERAL",
                        false
                );

        given(userRepository.findById(1L))
                .willReturn(Optional.empty());

        assertThatThrownBy(() ->
                announcementService.create(request, 1L)
        ).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("사용자를 찾을 수 없습니다.");
    }

    //공지 조회

    @Test
    @DisplayName("공지사항 조회 - 성공")
    void getAnnouncement_success() {

        Announcement announcement = mock(Announcement.class);

        given(announcementRepository.findById(1L))
                .willReturn(Optional.of(announcement));

        assertThatCode(() ->
                announcementService.getDetail(1L)
        ).doesNotThrowAnyException();

        then(announcementRepository)
                .should()
                .findById(1L);
    }

    // 공지 조회 실패

    @Test
    @DisplayName("공지사항 조회 - 존재하지 않음")
    void getAnnouncement_notFound() {

        given(announcementRepository.findById(1L))
                .willReturn(Optional.empty());

        assertThatThrownBy(() ->
                announcementService.getDetail(1L)
        ).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("공지사항을 찾을 수 없습니다.");
    }

    // 공지 수정

    @Test
    @DisplayName("공지사항 수정 - 성공")
    void updateAnnouncement_success() {

        Announcement announcement = mock(Announcement.class);

        AnnouncementRequest request =
                new AnnouncementRequest(
                        "수정 제목",
                        "수정 내용",
                        "EVENT",
                        false
                );
        Category category = mock(Category.class);

        given(categoryRepository.findByName(request.category()))
                .willReturn(Optional.of(category));

        given(announcementRepository.findById(1L))
                .willReturn(Optional.of(announcement));

        assertThatCode(() ->
                announcementService.update(1L, request)
        ).doesNotThrowAnyException();

        then(announcement)
                .should()
                .update(
                        request.title(),
                        request.content(),
                        category
                );
    }

    // 공지 삭제

    @Test
    @DisplayName("공지사항 삭제 - 성공")
    void deleteAnnouncement_success() {

        Announcement announcement = mock(Announcement.class);

        given(announcementRepository.findById(1L))
                .willReturn(Optional.of(announcement));

        assertThatCode(() ->
                announcementService.delete(1L)
        ).doesNotThrowAnyException();

        then(announcementRepository)
                .should()
                .delete(announcement);
    }
}
