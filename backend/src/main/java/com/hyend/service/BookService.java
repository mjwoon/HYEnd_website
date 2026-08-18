package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.book.BookResponse;
import com.hyend.dto.book.RentalResponse;
import com.hyend.entity.Book;
import com.hyend.entity.BookRental;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.mapper.BookMapper;
import com.hyend.repository.BookRentalRepository;
import com.hyend.repository.BookRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;
    private final BookRentalRepository rentalRepository;
    private final BookMapper bookMapper;
    private final UserRepository userRepository;

    @Value("${book.rental-days:7}")
    private int rentalDays;

    @Value("${book.extension-days:7}")
    private int extensionDays;

    @Cacheable(value = "books")
    public List<BookResponse> getAllBooks() {
        return bookRepository.findAll()
                .stream()
                .map(bookMapper::toResponse)
                .toList();
    }

    public BookResponse getBook(Long id) {
        return bookMapper.toResponse(findBook(id));
    }

    @Transactional
    @CacheEvict(value = "books", allEntries = true)
    public RentalResponse rentBook(Long bookId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (rentalRepository.existsByUserIdAndBookIdAndStatus(userId, bookId, BookRental.RentalStatus.ACTIVE)) {
            throw new BusinessException(ErrorCode.ALREADY_RENTED);
        }

        // 재고를 원자적으로 감소시킨다. 갱신된 행이 없으면 재고가 없거나 도서가 존재하지 않는 것.
        // 동시 요청에서도 available_copies > 0 조건이 DB에서 원자적으로 평가되어 oversell이 불가능하다.
        int updated = bookRepository.decrementAvailableIfPositive(bookId);
        if (updated == 0) {
            if (!bookRepository.existsById(bookId)) {
                throw new BusinessException(ErrorCode.BOOK_NOT_FOUND);
            }
            throw new BusinessException(ErrorCode.BOOK_NOT_AVAILABLE);
        }

        Book book = findBook(bookId);
        BookRental rental = BookRental.of(book, user, LocalDateTime.now().plusDays(rentalDays));
        return bookMapper.toResponse(rentalRepository.save(rental));
    }

    @Transactional
    @CacheEvict(value = "books", allEntries = true)
    public void returnBook(Long rentalId) {
        BookRental rental = findRental(rentalId);
        // ACTIVE일 때만 원자적으로 RETURNED 전이. 갱신 행이 0이면 이미 반납/취소된 것.
        int changed = rentalRepository.markStatusWithReturnedAt(
                rentalId, BookRental.RentalStatus.ACTIVE, BookRental.RentalStatus.RETURNED, LocalDateTime.now());
        if (changed == 0) {
            throw new BusinessException(ErrorCode.RENTAL_NOT_ACTIVE);
        }
        bookRepository.incrementAvailable(rental.getBook().getId());
    }

    public boolean isOverdue(Long rentalId) {
        return LocalDate.now().isAfter(findRental(rentalId).getDueDate().toLocalDate());
    }

    public List<RentalResponse> getMyRentals(Long userId) {
        return rentalRepository.findByUserIdAndStatus(userId, BookRental.RentalStatus.ACTIVE)
                .stream()
                .map(bookMapper::toResponse)
                .toList();
    }

    @Transactional
    public RentalResponse extendRental(Long rentalId, Long userId) {
        BookRental rental = rentalRepository.findByIdAndUserId(rentalId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RENTAL_NOT_FOUND));
        if (!rental.canExtend()) {
            throw new BusinessException(ErrorCode.RENTAL_EXTEND_NOT_ALLOWED);
        }
        rental.extend(extensionDays);
        return bookMapper.toResponse(rental);
    }

    @Transactional
    @CacheEvict(value = "books", allEntries = true)
    public void cancelRental(Long rentalId, Long userId) {
        BookRental rental = rentalRepository.findByIdAndUserId(rentalId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RENTAL_NOT_FOUND));
        // ACTIVE일 때만 원자적으로 CANCELLED 전이. 갱신 행이 0이면 이미 반납/취소된 것.
        int changed = rentalRepository.markStatus(
                rentalId, BookRental.RentalStatus.ACTIVE, BookRental.RentalStatus.CANCELLED);
        if (changed == 0) {
            throw new BusinessException(ErrorCode.RENTAL_NOT_ACTIVE);
        }
        bookRepository.incrementAvailable(rental.getBook().getId());
    }

    private Book findBook(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOK_NOT_FOUND));
    }

    private BookRental findRental(Long id) {
        return rentalRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RENTAL_NOT_FOUND));
    }
}
