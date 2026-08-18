package com.hyend.repository;

import com.hyend.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("SELECT p FROM Post p WHERE p.boardType = :boardType AND (:keyword IS NULL OR p.title LIKE %:keyword% OR p.content LIKE %:keyword%)")
    Page<Post> findByBoardTypeWithKeyword(@Param("boardType") Post.BoardType boardType, @Param("keyword") String keyword, Pageable pageable);

    @Modifying
    @Query("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    void incrementViewCount(@Param("id") Long id);

    @Query("SELECT p FROM Post p WHERE p.author.id = :authorId AND (:boardType IS NULL OR p.boardType = :boardType)")
    Page<Post> findByAuthorIdWithFilter(@Param("authorId") Long authorId, @Param("boardType") Post.BoardType boardType, Pageable pageable);
}
