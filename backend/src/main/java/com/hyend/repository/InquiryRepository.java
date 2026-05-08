package com.hyend.repository;

import com.hyend.entity.Inquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    Page<Inquiry> findByAuthorId(Long authorId, Pageable pageable);

    // 비공개 글은 작성자 또는 STAFF/ADMIN만 조회 가능 - 서비스 레이어에서 처리
    @Query("SELECT i FROM Inquiry i WHERE i.isPrivate = false OR i.author.id = :userId")
    Page<Inquiry> findVisibleToUser(@Param("userId") Long userId, Pageable pageable);
}
