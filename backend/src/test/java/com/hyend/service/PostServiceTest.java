package com.hyend.service;

import com.hyend.dto.post.PostRequest;
import com.hyend.entity.Post;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.PostRepository;
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
class PostServiceTest {

    @Mock PostRepository postRepository;
    @Mock UserRepository userRepository;
    @InjectMocks PostService postService;

    @Test
    @DisplayName("자유게시판 글 작성 - 학생 성공")
    void createFreePost_studentSuccess() {
        PostRequest request = new PostRequest("제목", "내용");
        User author = mock(User.class);

        given(userRepository.findById(1L)).willReturn(Optional.of(author));
        given(postRepository.save(any(Post.class))).willAnswer(i -> i.getArgument(0));

        assertThatCode(() -> postService.create(Post.BoardType.FREE, request, 1L, User.Role.STUDENT))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("공모전 게시판 글 작성 - 학생 실패")
    void createContestPost_studentFails() {
        PostRequest request = new PostRequest("제목", "내용");

        assertThatThrownBy(() -> postService.create(Post.BoardType.CONTEST, request, 1L, User.Role.STUDENT))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("공모전 게시판 글 작성 - STAFF 성공")
    void createContestPost_staffSuccess() {
        PostRequest request = new PostRequest("공모전 제목", "내용");
        User author = mock(User.class);

        given(userRepository.findById(1L)).willReturn(Optional.of(author));
        given(postRepository.save(any(Post.class))).willAnswer(i -> i.getArgument(0));

        assertThatCode(() -> postService.create(Post.BoardType.CONTEST, request, 1L, User.Role.STAFF))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("게시글 수정 - 본인 성공")
    void updatePost_ownerSuccess() {
        PostRequest request = new PostRequest("수정 제목", "수정 내용");
        Post post = mock(Post.class);
        User author = mock(User.class);

        given(postRepository.findById(1L)).willReturn(Optional.of(post));
        given(post.isAuthor(1L)).willReturn(true);
        given(post.getBoardType()).willReturn(Post.BoardType.FREE);
        given(post.getAuthor()).willReturn(author);
        given(author.getName()).willReturn("작성자");
        given(author.getId()).willReturn(1L);

        assertThatCode(() -> postService.update(1L, request, 1L, User.Role.STUDENT))
                .doesNotThrowAnyException();
        then(post).should().update("수정 제목", "수정 내용");
    }

    @Test
    @DisplayName("게시글 수정 - 타인 실패")
    void updatePost_nonOwnerFails() {
        PostRequest request = new PostRequest("수정 제목", "수정 내용");
        Post post = mock(Post.class);

        given(postRepository.findById(1L)).willReturn(Optional.of(post));
        given(post.isAuthor(2L)).willReturn(false);

        assertThatThrownBy(() -> postService.update(1L, request, 2L, User.Role.STUDENT))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("게시글 삭제 - ADMIN 성공")
    void deletePost_adminSuccess() {
        Post post = mock(Post.class);
        given(postRepository.findById(1L)).willReturn(Optional.of(post));

        assertThatCode(() -> postService.delete(1L, 99L, User.Role.ADMIN))
                .doesNotThrowAnyException();
        then(postRepository).should().delete(post);
    }

    @Test
    @DisplayName("게시글 조회 - 없음")
    void getDetail_notFound() {
        given(postRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> postService.getDetail(99L))
                .isInstanceOf(BusinessException.class);
    }
}
