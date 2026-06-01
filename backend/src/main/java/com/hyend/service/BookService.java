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
        Book book = findBook(bookId);

        if (book.getAvailableCopies() <= 0) {
            throw new BusinessException(ErrorCode.BOOK_NOT_AVAILABLE);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (rentalRepository.existsByUserIdAndBookIdAndStatus(userId, bookId, BookRental.RentalStatus.ACTIVE)) {
            throw new BusinessException(ErrorCode.ALREADY_RENTED);
        }

        BookRental rental = BookRental.of(book, user, LocalDateTime.now().plusDays(rentalDays));
        book.decreaseAvailable();
        return bookMapper.toResponse(rentalRepository.save(rental));
    }

    @Transactional
    @CacheEvict(value = "books", allEntries = true)
    public void returnBook(Long rentalId) {
        BookRental rental = findRental(rentalId);
        if (rental.getStatus() != BookRental.RentalStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.RENTAL_NOT_ACTIVE);
        }
        rental.returnBook();
        rental.getBook().increaseAvailable();
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
        if (rental.getStatus() != BookRental.RentalStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.RENTAL_NOT_ACTIVE);
        }
        rental.cancel();
        rental.getBook().increaseAvailable();
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
