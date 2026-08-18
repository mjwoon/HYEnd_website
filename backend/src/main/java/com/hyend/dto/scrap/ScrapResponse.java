package com.hyend.dto.scrap;

import com.hyend.entity.Scrap;

import java.time.LocalDateTime;

public record ScrapResponse(
        Long scrapId,
        Long postId,
        String postTitle,
        String boardType,
        String authorName,
        LocalDateTime scrappedAt
) {
    public static ScrapResponse from(Scrap scrap) {
        return new ScrapResponse(
                scrap.getId(),
                scrap.getPost().getId(),
                scrap.getPost().getTitle(),
                scrap.getPost().getBoardType().name(),
                scrap.getPost().getAuthor().getName(),
                scrap.getCreatedAt()
        );
    }
}
