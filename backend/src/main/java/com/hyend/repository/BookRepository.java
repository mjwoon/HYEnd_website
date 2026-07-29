package com.hyend.repository;

import com.hyend.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookRepository extends JpaRepository<Book, Long> {

    Page<Book> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    Page<Book> findByAvailableCopiesGreaterThan(int copies, Pageable pageable);

    /**
     * 재고를 원자적으로 1 감소시킨다. {@code available_copies > 0}일 때만 갱신되므로
     * 동시 요청에서도 재고 초과 대여(oversell)가 발생하지 않는다.
     *
     * @return 갱신된 행 수 (1이면 성공, 0이면 재고 없음)
     */
    @Modifying
    @Query("update Book b set b.availableCopies = b.availableCopies - 1 " +
           "where b.id = :id and b.availableCopies > 0")
    int decrementAvailableIfPositive(@Param("id") Long id);

    /**
     * 재고를 원자적으로 1 증가시킨다(반납·취소). 동시 반납에서도 lost update 없이
     * 증가가 정확히 반영된다. (호출부에서 대여 상태 전이가 성공한 경우에만 호출한다.)
     */
    @Modifying
    @Query("update Book b set b.availableCopies = b.availableCopies + 1 where b.id = :id")
    int incrementAvailable(@Param("id") Long id);
}
