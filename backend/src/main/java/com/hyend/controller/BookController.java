package com.hyend.controller;

import com.hyend.dto.book.BookResponse;
import com.hyend.dto.book.RentRequest;
import com.hyend.dto.book.RentalResponse;
import com.hyend.security.UserPrincipal;
import com.hyend.service.BookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Books", description = "도서 대여 API")
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

    @Operation(summary = "내 대여 목록 조회", description = "현재 ACTIVE 상태인 대여 목록 반환")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/rentals/my")
    public ResponseEntity<List<RentalResponse>> getMyRentals(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(bookService.getMyRentals(principal.getId()));
    }

    @Operation(summary = "대여 연장", description = "최대 1회, 7일 연장")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/rentals/{rentalId}/extend")
    public ResponseEntity<RentalResponse> extendRental(
            @PathVariable Long rentalId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(bookService.extendRental(rentalId, principal.getId()));
    }

    @Operation(summary = "대여 취소")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/rentals/{rentalId}")
    public ResponseEntity<Void> cancelRental(
            @PathVariable Long rentalId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        bookService.cancelRental(rentalId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}