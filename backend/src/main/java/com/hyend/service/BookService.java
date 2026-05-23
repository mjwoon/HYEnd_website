package com.hyend.service;

import com.hyend.dto.book.BookResponse;
import com.hyend.dto.book.RentRequest;
import com.hyend.dto.book.RentalResponse;
import com.hyend.entity.Book;
import com.hyend.entity.BookRental;
import com.hyend.entity.User;
import com.hyend.mapper.BookMapper;
import com.hyend.repository.BookRentalRepository;
import com.hyend.repository.BookRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// TODO [H-7] 도서 서비스 구현 (대출/반납/재고 로직)
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;
    private final BookRentalRepository rentalRepository;
    private final BookMapper bookMapper;
    private final UserRepository userRepository;


    @Cacheable(value = "books")
    public List<BookResponse> getAllBooks() {

        return bookRepository.findAll()
                .stream()
                .map(bookMapper::toResponse)
                .toList();
    }

    public BookResponse getBook(Long id) {

        Book book = bookRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("책을 찾을 수 없습니다."));

        return bookMapper.toResponse(book);
    }

    /*책 대출*/
    @Transactional
    @CacheEvict(value = "books", allEntries = true)
    public RentalResponse rentBook(RentRequest request) {

        Book book = bookRepository.findById(request.bookId())
                .orElseThrow(() ->
                        new IllegalArgumentException("책을 찾을 수 없습니다."));

        if (book.getAvailableCopies() <= 0) {
            throw new IllegalStateException("대출 가능한 재고가 없습니다.");
        }

        boolean alreadyRented =
                rentalRepository.existsByUserIdAndBookIdAndStatus(
                        request.userId(),
                        request.bookId(),
                        BookRental.RentalStatus.ACTIVE
                );

        if (alreadyRented) {
            throw new IllegalStateException("이미 대출 중인 책입니다.");
        }

        // 사용자 조회
        User user=userRepository.findByEmail(request.email())
                .orElseThrow(() ->
                        new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        //대출 생성
        BookRental rental =
                BookRental.of(
                        book,
                        user,
                        LocalDateTime.now().plusDays(7)
                );


        // 재고 감소
        book.decreaseAvailable();
        BookRental savedRental =
                rentalRepository.save(rental);

        return bookMapper.toResponse(savedRental);
    }

    // 책 반납
    @Transactional
    @CacheEvict(value = "books", allEntries = true)
    public void returnBook(Long rentalId) {

        BookRental rental =
                rentalRepository.findById(rentalId)
                        .orElseThrow(() ->
                                new IllegalArgumentException("대출 정보를 찾을 수 없습니다."));

        // 이미 반납했는지 검사
        if (rental.getStatus()==BookRental.RentalStatus.RETURNED) {
            throw new IllegalStateException("이미 반납된 책입니다.");
        }

        rental.returnBook();

        // 재고 증가
        Book book = rental.getBook();

        book.increaseAvailable();

    }

    public boolean isOverdue(Long rentalId) {

        BookRental rental =
                rentalRepository.findById(rentalId)
                        .orElseThrow(() ->
                                new IllegalArgumentException("대출 정보를 찾을 수 없습니다."));

        return LocalDate.now().isAfter(rental.getDueDate().toLocalDate());
    }
}
