package com.hyend.repository;

import com.hyend.entity.BookRental;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookRentalRepository extends JpaRepository<BookRental, Long> {

    List<BookRental> findByUserIdAndStatus(Long userId, BookRental.RentalStatus status);

    boolean existsByUserIdAndBookIdAndStatus(Long userId, Long bookId, BookRental.RentalStatus status);

    @Query("SELECT r FROM BookRental r WHERE r.status = 'ACTIVE' AND r.dueDate < :now")
    List<BookRental> findOverdueRentals(@Param("now") LocalDateTime now);

    Optional<BookRental> findByIdAndUserId(Long id, Long userId);
}
