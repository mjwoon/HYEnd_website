package com.hyend.dto.post;

import com.hyend.entity.Post;

import java.time.LocalDateTime;

public record PostSummary(
        Long id,
        String title,
        String authorName,
        int viewCount,
        LocalDateTime createdAt
) {
    public static PostSummary from(Post post) {
        return new PostSummary(
                post.getId(),
                post.getTitle(),
                post.getAuthor().getName(),
                post.getViewCount(),
                post.getCreatedAt()
        );
    }
}
