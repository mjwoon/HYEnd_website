package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.scrap.ScrapResponse;
import com.hyend.entity.Post;
import com.hyend.entity.Scrap;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.PostRepository;
import com.hyend.repository.ScrapRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScrapService {

    private final ScrapRepository scrapRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public Page<ScrapResponse> getMyScraps(Long userId, Pageable pageable) {
        return scrapRepository.findByUserId(userId, pageable).map(ScrapResponse::from);
    }

    @Transactional
    public ScrapResponse scrap(Long postId, Long userId) {
        if (scrapRepository.existsByUserIdAndPostId(userId, postId)) {
            throw new BusinessException(ErrorCode.ALREADY_SCRAPPED);
        }
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        User user = userRepository.getReferenceById(userId);
        return ScrapResponse.from(scrapRepository.save(Scrap.of(user, post)));
    }

    @Transactional
    public void unscrap(Long scrapId, Long userId) {
        Scrap scrap = scrapRepository.findById(scrapId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SCRAP_NOT_FOUND));
        if (!scrap.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
        scrapRepository.delete(scrap);
    }
}
