package com.hyend.service;

import com.hyend.dto.book.RentalResponse;
import com.hyend.dto.book.RentRequest;
import com.hyend.entity.Book;
import com.hyend.entity.BookRental;
import com.hyend.entity.User;
import com.hyend.mapper.BookMapper;
import com.hyend.repository.BookRentalRepository;
import com.hyend.repository.BookRepository;
import com.hyend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;

// TODO [H-9] BookService 단위 테스트 작성 (대출/반납/재고 로직 검증)

@ExtendWith(MockitoExtension.class)
class BookServiceTest {
    @Mock
    BookRepository bookRepository;

    @Mock
    BookRentalRepository bookRentalRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    BookMapper bookMapper;

    @InjectMocks
    BookService bookService;

    //대출 성공

    @Test
    @DisplayName("도서 대출 - 성공")
    void rentBook_success() {

        RentRequest request =
                new RentRequest(1L, "test@test.com");

        Book book = mock(Book.class);
        User user = mock(User.class);

        given(bookRepository.findById(1L))
                .willReturn(Optional.of(book));

        given(userRepository.findByEmail("test@test.com"))
                .willReturn(Optional.of(user));

        given(bookRentalRepository
                .existsByUserIdAndBookIdAndStatus(
                        any(), any(), any()
                ))
                .willReturn(false);

        given(book.getAvailableCopies())
                .willReturn(3);

        given(bookRentalRepository.save(any(BookRental.class)))
                .willAnswer(invocation -> invocation.getArgument(0));

        given(bookMapper.toResponse(any(BookRental.class)))
                .willReturn(new RentalResponse(
                        1L,
                        "title",
                        "author",
                        "category",
                        true,
                        LocalDateTime.now(),
                        LocalDateTime.now().plusDays(7)
                ));

        assertThatCode(() ->
                bookService.rentBook(request)
        ).doesNotThrowAnyException();

        then(book).should().decreaseAvailable();
        then(bookRentalRepository)
                .should()
                .save(any(BookRental.class));
    }

    // 재고 부족

    @Test
    @DisplayName("도서 대출 - 재고 부족")
    void rentBook_noStock() {

        RentRequest request =
                new RentRequest(1L, "test@test.com");

        Book book = mock(Book.class);

        given(bookRepository.findById(1L))
                .willReturn(Optional.of(book));

        given(book.getAvailableCopies())
                .willReturn(0);

        assertThatThrownBy(() ->
                bookService.rentBook(request)
        ).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("대출 가능한 도서가 없습니다.");
    }

    // 중복 대출

    @Test
    @DisplayName("도서 대출 - 이미 대출한 도서")
    void rentBook_alreadyRented() {

        RentRequest request =
                new RentRequest(1L, "test@test.com");

        Book book = mock(Book.class);
        User user = mock(User.class);

        given(bookRepository.findById(1L))
                .willReturn(Optional.of(book));

        given(userRepository.findByEmail("test@test.com"))
                .willReturn(Optional.of(user));

        given(book.getAvailableCopies())
                .willReturn(2);

        given(bookRentalRepository
                .existsByUserIdAndBookIdAndStatus(
                        any(), any(), any()
                ))
                .willReturn(true);

        assertThatThrownBy(() ->
                bookService.rentBook(request)
        ).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("이미 대출한 도서입니다.");
    }

    // 반납 성공

    @Test
    @DisplayName("도서 반납 - 성공")
    void returnBook_success() {

        BookRental rental = mock(BookRental.class);
        Book book = mock(Book.class);

        given(bookRentalRepository.findById(1L))
                .willReturn(Optional.of(rental));

        given(rental.getBook())
                .willReturn(book);

        assertThatCode(() ->
                bookService.returnBook(1L)
        ).doesNotThrowAnyException();

        then(rental).should().returnBook();
        then(book).should().increaseAvailable();
    }

    // 연체 반납

    @Test
    @DisplayName("도서 반납 - 연체")
    void returnBook_overdue() {

        BookRental rental = mock(BookRental.class);
        Book book = mock(Book.class);

        given(bookRentalRepository.findById(1L))
                .willReturn(Optional.of(rental));

        given(rental.getBook())
                .willReturn(book);


        assertThatCode(() ->
                bookService.returnBook(1L)
        ).doesNotThrowAnyException();

        then(rental).should().returnBook();
        then(book).should().increaseAvailable();
    }
}
