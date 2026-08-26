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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {
    @Mock BookRepository bookRepository;
    @Mock BookRentalRepository bookRentalRepository;
    @Mock UserRepository userRepository;
    @Mock BookMapper bookMapper;
    @InjectMocks BookService bookService;

    @Test
    @DisplayName("도서 대출 - 성공 (원자적 재고 감소)")
    void rentBook_success() {
        Book book = mock(Book.class);
        User user = mock(User.class);

        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(bookRentalRepository.existsByUserIdAndBookIdAndStatus(any(), any(), any())).willReturn(false);
        given(bookRepository.decrementAvailableIfPositive(1L)).willReturn(1);
        given(bookRepository.findById(1L)).willReturn(Optional.of(book));
        given(bookRentalRepository.save(any(BookRental.class))).willAnswer(i -> i.getArgument(0));
        given(bookMapper.toResponse(any(BookRental.class))).willReturn(
                new RentalResponse(1L, 1L, "title", "author", true, false,
                        LocalDateTime.now(), LocalDateTime.now().plusDays(7)));

        assertThatCode(() -> bookService.rentBook(1L, 1L)).doesNotThrowAnyException();

        then(bookRepository).should().decrementAvailableIfPositive(1L);
        then(bookRentalRepository).should().save(any(BookRental.class));
    }

    @Test
    @DisplayName("도서 대출 - 재고 부족 (감소 행 0)")
    void rentBook_noStock() {
        given(userRepository.findById(1L)).willReturn(Optional.of(mock(User.class)));
        given(bookRentalRepository.existsByUserIdAndBookIdAndStatus(any(), any(), any())).willReturn(false);
        given(bookRepository.decrementAvailableIfPositive(1L)).willReturn(0);
        given(bookRepository.existsById(1L)).willReturn(true);

        assertThatThrownBy(() -> bookService.rentBook(1L, 1L))
                .isInstanceOf(BusinessException.class);

        then(bookRentalRepository).should(never()).save(any(BookRental.class));
    }

    @Test
    @DisplayName("도서 대출 - 이미 대출한 도서 (재고 감소 미시도)")
    void rentBook_alreadyRented() {
        given(userRepository.findById(1L)).willReturn(Optional.of(mock(User.class)));
        given(bookRentalRepository.existsByUserIdAndBookIdAndStatus(any(), any(), any())).willReturn(true);

        assertThatThrownBy(() -> bookService.rentBook(1L, 1L))
                .isInstanceOf(BusinessException.class);

        then(bookRepository).should(never()).decrementAvailableIfPositive(anyLong());
    }

    @Test
    @DisplayName("도서 반납 - 성공 (원자적 상태 전이 + 재고 증가)")
    void returnBook_success() {
        BookRental rental = mock(BookRental.class);
        Book book = mock(Book.class);

        given(bookRentalRepository.findById(1L)).willReturn(Optional.of(rental));
        given(bookRentalRepository.markStatusWithReturnedAt(eq(1L), any(), any(), any())).willReturn(1);
        given(rental.getBook()).willReturn(book);
        given(book.getId()).willReturn(5L);

        assertThatCode(() -> bookService.returnBook(1L)).doesNotThrowAnyException();

        then(bookRepository).should().incrementAvailable(5L);
    }

    @Test
    @DisplayName("도서 반납 - 이미 반납/취소된 대출 (전이 행 0)")
    void returnBook_notActive() {
        BookRental rental = mock(BookRental.class);

        given(bookRentalRepository.findById(1L)).willReturn(Optional.of(rental));
        given(bookRentalRepository.markStatusWithReturnedAt(eq(1L), any(), any(), any())).willReturn(0);

        assertThatThrownBy(() -> bookService.returnBook(1L))
                .isInstanceOf(BusinessException.class);

        then(bookRepository).should(never()).incrementAvailable(anyLong());
    }
}
