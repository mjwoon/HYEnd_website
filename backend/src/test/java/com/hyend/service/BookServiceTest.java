package com.hyend.service;

import com.hyend.dto.book.RentalResponse;
import com.hyend.entity.Book;
import com.hyend.entity.BookRental;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
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

@ExtendWith(MockitoExtension.class)
class BookServiceTest {
    @Mock BookRepository bookRepository;
    @Mock BookRentalRepository bookRentalRepository;
    @Mock UserRepository userRepository;
    @Mock BookMapper bookMapper;
    @InjectMocks BookService bookService;

    @Test
    @DisplayName("도서 대출 - 성공")
    void rentBook_success() {
        Book book = mock(Book.class);
        User user = mock(User.class);

        given(bookRepository.findById(1L)).willReturn(Optional.of(book));
        given(book.getAvailableCopies()).willReturn(3);
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(bookRentalRepository.existsByUserIdAndBookIdAndStatus(any(), any(), any())).willReturn(false);
        given(bookRentalRepository.save(any(BookRental.class))).willAnswer(i -> i.getArgument(0));
        given(bookMapper.toResponse(any(BookRental.class))).willReturn(
                new RentalResponse(1L, 1L, "title", "author", "category", true, false,
                        LocalDateTime.now(), LocalDateTime.now().plusDays(7)));

        assertThatCode(() -> bookService.rentBook(1L, 1L)).doesNotThrowAnyException();

        then(book).should().decreaseAvailable();
        then(bookRentalRepository).should().save(any(BookRental.class));
    }

    @Test
    @DisplayName("도서 대출 - 재고 부족")
    void rentBook_noStock() {
        Book book = mock(Book.class);

        given(bookRepository.findById(1L)).willReturn(Optional.of(book));
        given(book.getAvailableCopies()).willReturn(0);

        assertThatThrownBy(() -> bookService.rentBook(1L, 1L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("도서 대출 - 이미 대출한 도서")
    void rentBook_alreadyRented() {
        Book book = mock(Book.class);
        User user = mock(User.class);

        given(bookRepository.findById(1L)).willReturn(Optional.of(book));
        given(book.getAvailableCopies()).willReturn(2);
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(bookRentalRepository.existsByUserIdAndBookIdAndStatus(any(), any(), any())).willReturn(true);

        assertThatThrownBy(() -> bookService.rentBook(1L, 1L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("도서 반납 - 성공")
    void returnBook_success() {
        BookRental rental = mock(BookRental.class);
        Book book = mock(Book.class);

        given(bookRentalRepository.findById(1L)).willReturn(Optional.of(rental));
        given(rental.getStatus()).willReturn(BookRental.RentalStatus.ACTIVE);
        given(rental.getBook()).willReturn(book);

        assertThatCode(() -> bookService.returnBook(1L)).doesNotThrowAnyException();

        then(rental).should().returnBook();
        then(book).should().increaseAvailable();
    }

    @Test
    @DisplayName("도서 반납 - 이미 반납된 대출")
    void returnBook_notActive() {
        BookRental rental = mock(BookRental.class);

        given(bookRentalRepository.findById(1L)).willReturn(Optional.of(rental));
        given(rental.getStatus()).willReturn(BookRental.RentalStatus.RETURNED);

        assertThatThrownBy(() -> bookService.returnBook(1L))
                .isInstanceOf(BusinessException.class);
    }
}
