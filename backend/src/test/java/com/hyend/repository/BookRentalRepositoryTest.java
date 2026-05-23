package com.hyend.repository;

import com.hyend.entity.Book;
import com.hyend.entity.BookRental;
import com.hyend.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

// TODO [H-9] BookRentalRepository 통합 테스트 작성
@DataJpaTest
class BookRentalRepositoryTest {

    @Autowired
    BookRentalRepository bookRentalRepository;

    @Autowired
    BookRepository bookRepository;

    @Autowired
    UserRepository userRepository;

    @Test
    @DisplayName("사용자와 도서, 상태로 대출 여부 조회 - 존재함")
    void existsByUserIdAndBookIdAndStatus_true() {

        // given
        User user = User.of(
                "test@test.com",
                "encoded-password",
                "홍길동",
                User.Role.STUDENT
        );

        User savedUser = userRepository.save(user);

        Book book = Book.of(
                "자바의 정석",
                "남궁성",
                "123456789",
                3
        );

        Book savedBook = bookRepository.save(book);

        BookRental rental = BookRental.of(
                savedBook,
                savedUser,
                LocalDateTime.now().plusDays(7)
        );

        bookRentalRepository.save(rental);

        // when
        boolean result =
                bookRentalRepository.existsByUserIdAndBookIdAndStatus(
                        savedUser.getId(),
                        savedBook.getId(),
                        BookRental.RentalStatus.ACTIVE
                );

        // then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("사용자와 도서, 상태로 대출 여부 조회 - 존재하지 않음")
    void existsByUserIdAndBookIdAndStatus_false() {

        // given
        User user = User.of(
                "test@test.com",
                "encoded-password",
                "홍길동",
                User.Role.STUDENT
        );

        User savedUser = userRepository.save(user);

        Book book = Book.of(
                "스프링 부트",
                "김영한",
                "987654321",
                2
        );

        Book savedBook = bookRepository.save(book);

        // when
        boolean result =
                bookRentalRepository.existsByUserIdAndBookIdAndStatus(
                        savedUser.getId(),
                        savedBook.getId(),
                        BookRental.RentalStatus.ACTIVE
                );

        // then
        assertThat(result).isFalse();
    }
}
