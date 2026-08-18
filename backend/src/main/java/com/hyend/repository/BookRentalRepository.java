package com.hyend.repository;

import com.hyend.entity.BookRental;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    /**
     * 반납: 현재 상태가 {@code from}일 때만 {@code to}로 원자적 전이하고 returnedAt을 기록한다.
     * 동시 반납 시 조건이 DB에서 원자적으로 평가되어 상태 전이가 정확히 한 번만 일어난다.
     *
     * @return 갱신된 행 수 (1이면 전이 성공, 0이면 이미 처리됨)
     */
    @Modifying
    @Query("update BookRental r set r.status = :to, r.returnedAt = :returnedAt " +
           "where r.id = :id and r.status = :from")
    int markStatusWithReturnedAt(@Param("id") Long id,
                                 @Param("from") BookRental.RentalStatus from,
                                 @Param("to") BookRental.RentalStatus to,
                                 @Param("returnedAt") LocalDateTime returnedAt);

    /**
     * 취소: 현재 상태가 {@code from}일 때만 {@code to}로 원자적 전이한다.
     *
     * @return 갱신된 행 수 (1이면 전이 성공, 0이면 이미 처리됨)
     */
    @Modifying
    @Query("update BookRental r set r.status = :to where r.id = :id and r.status = :from")
    int markStatus(@Param("id") Long id,
                   @Param("from") BookRental.RentalStatus from,
                   @Param("to") BookRental.RentalStatus to);
}
