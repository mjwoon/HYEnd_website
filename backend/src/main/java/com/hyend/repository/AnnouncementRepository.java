package com.hyend.repository;

import com.hyend.entity.Announcement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    Page<Announcement> findByCategoryId(Long categoryId, Pageable pageable);

    List<Announcement> findByIsPinnedTrue();

    Page<Announcement> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    @Modifying
    @Query("UPDATE Announcement a SET a.viewCount = a.viewCount + 1 WHERE a.id = :id")
    void incrementViewCount(@Param("id") Long id);
}
