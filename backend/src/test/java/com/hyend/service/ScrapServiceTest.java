package com.hyend.service;

import com.hyend.entity.Post;
import com.hyend.entity.Scrap;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.PostRepository;
import com.hyend.repository.ScrapRepository;
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
class ScrapServiceTest {

    @Mock ScrapRepository scrapRepository;
    @Mock PostRepository postRepository;
    @Mock UserRepository userRepository;
    @InjectMocks ScrapService scrapService;

    @Test
    @DisplayName("스크랩 추가 - 성공")
    void scrap_success() {
        Post post = mock(Post.class);
        User user = mock(User.class);
        Scrap scrap = mock(Scrap.class);
        Post scrapPost = mock(Post.class);
        User scrapAuthor = mock(User.class);

        given(scrapRepository.existsByUserIdAndPostId(1L, 1L)).willReturn(false);
        given(postRepository.findById(1L)).willReturn(Optional.of(post));
        given(userRepository.getReferenceById(1L)).willReturn(user);
        given(scrapRepository.save(any(Scrap.class))).willReturn(scrap);
        given(scrap.getId()).willReturn(1L);
        given(scrap.getPost()).willReturn(scrapPost);
        given(scrapPost.getId()).willReturn(1L);
        given(scrapPost.getTitle()).willReturn("제목");
        given(scrapPost.getBoardType()).willReturn(Post.BoardType.FREE);
        given(scrapPost.getAuthor()).willReturn(scrapAuthor);
        given(scrapAuthor.getName()).willReturn("작성자");

        assertThatCode(() -> scrapService.scrap(1L, 1L)).doesNotThrowAnyException();
        then(scrapRepository).should().save(any(Scrap.class));
    }

    @Test
    @DisplayName("스크랩 추가 - 이미 스크랩한 게시글")
    void scrap_alreadyScrapped() {
        given(scrapRepository.existsByUserIdAndPostId(1L, 1L)).willReturn(true);

        assertThatThrownBy(() -> scrapService.scrap(1L, 1L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("스크랩 삭제 - 성공")
    void unscrap_success() {
        Scrap scrap = mock(Scrap.class);
        User owner = mock(User.class);

        given(scrapRepository.findById(1L)).willReturn(Optional.of(scrap));
        given(scrap.getUser()).willReturn(owner);
        given(owner.getId()).willReturn(1L);

        assertThatCode(() -> scrapService.unscrap(1L, 1L)).doesNotThrowAnyException();
        then(scrapRepository).should().delete(scrap);
    }

    @Test
    @DisplayName("스크랩 삭제 - 타인 실패")
    void unscrap_nonOwnerFails() {
        Scrap scrap = mock(Scrap.class);
        User owner = mock(User.class);

        given(scrapRepository.findById(1L)).willReturn(Optional.of(scrap));
        given(scrap.getUser()).willReturn(owner);
        given(owner.getId()).willReturn(1L);

        assertThatThrownBy(() -> scrapService.unscrap(1L, 99L))
                .isInstanceOf(BusinessException.class);
    }
}
