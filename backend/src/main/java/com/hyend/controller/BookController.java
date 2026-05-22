package com.hyend.controller;

import com.hyend.dto.book.BookResponse;
import com.hyend.dto.book.RentRequest;
import com.hyend.dto.book.RentalResponse;
import com.hyend.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// TODO [H-7] 도서 컨트롤러 구현
@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {
    private final BookService bookService;

    @GetMapping
    public ResponseEntity<List<BookResponse>> getAllBooks() {
        return ResponseEntity.ok(bookService.getAllBooks());
    }

    //단일 도서 조회

    @GetMapping("/{id}")
    public ResponseEntity<BookResponse> getBook(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getBook(id));
    }

    //도서 대출
    @PostMapping("/rent")
    public ResponseEntity<RentalResponse> rentBook(@RequestBody RentRequest request) {
        return ResponseEntity.ok(bookService.rentBook(request));
    }

    //도서 반납
    @PostMapping("/return/{rentalId}")
    public ResponseEntity<Void> returnBook(@PathVariable Long rentalId) {
        bookService.returnBook(rentalId);
        return ResponseEntity.ok().build();
    }

    //연체 여부 확인
    @GetMapping("/overdue/{rentalId}")
    public ResponseEntity<Boolean> isOverdue(@PathVariable Long rentalId) {
        return ResponseEntity.ok(bookService.isOverdue(rentalId));
    }
}