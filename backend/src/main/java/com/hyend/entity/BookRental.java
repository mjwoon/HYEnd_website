package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_rentals")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class BookRental extends BaseTimeEntity {

    public enum RentalStatus {
        ACTIVE, RETURNED, OVERDUE, CANCELLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime rentedAt;

    @Column(nullable = false)
    private LocalDateTime dueDate;

    private LocalDateTime returnedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentalStatus status = RentalStatus.ACTIVE;

    @Column(nullable = false)
    private boolean extended = false;

    public static BookRental of(Book book, User user, LocalDateTime dueDate) {
        BookRental rental = new BookRental();
        rental.book = book;
        rental.user = user;
        rental.dueDate = dueDate;
        rental.status = RentalStatus.ACTIVE;
        rental.extended = false;
        return rental;
    }

    // 반납·취소 상태 전이는 동시성 안전을 위해 BookRentalRepository의 원자적 조건부 UPDATE
    // (markStatusWithReturnedAt / markStatus)로 처리한다.

    public void extend(int days) {
        this.dueDate = this.dueDate.plusDays(days);
        this.extended = true;
    }

    public boolean canExtend() {
        return !this.extended && this.status == RentalStatus.ACTIVE;
    }
}
