package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.post.PostRequest;
import com.hyend.dto.post.PostResponse;
import com.hyend.dto.post.PostSummary;
import com.hyend.entity.Post;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.PostRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public Page<PostSummary> getMyPosts(Long authorId, Post.BoardType boardType, Pageable pageable) {
        return postRepository.findByAuthorIdWithFilter(authorId, boardType, pageable)
                .map(PostSummary::from);
    }

    public Page<PostSummary> getList(Post.BoardType boardType, String keyword, Pageable pageable) {
        return postRepository.findByBoardTypeWithKeyword(boardType, keyword, pageable)
                .map(PostSummary::from);
    }

    @Transactional
    public PostResponse getDetail(Long id) {
        Post post = find(id);
        postRepository.incrementViewCount(id);
        return PostResponse.from(post);
    }

    @Transactional
    public PostResponse create(Post.BoardType boardType, PostRequest request, Long authorId, User.Role userRole) {
        if (boardType == Post.BoardType.CONTEST && userRole != User.Role.STAFF && userRole != User.Role.ADMIN) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return PostResponse.from(postRepository.save(Post.of(request.title(), request.content(), boardType, author)));
    }

    @Transactional
    public PostResponse update(Long id, PostRequest request, Long userId, User.Role userRole) {
        Post post = find(id);
        checkEditPermission(post, userId, userRole);
        post.update(request.title(), request.content());
        return PostResponse.from(post);
    }

    @Transactional
    public void delete(Long id, Long userId, User.Role userRole) {
        Post post = find(id);
        checkEditPermission(post, userId, userRole);
        postRepository.delete(post);
    }

    private Post find(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
    }

    private void checkEditPermission(Post post, Long userId, User.Role userRole) {
        if (userRole == User.Role.ADMIN) return;
        if (!post.isAuthor(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
    }
}
