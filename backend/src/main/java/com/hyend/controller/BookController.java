package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.book.BookResponse;
import com.hyend.dto.book.RentRequest;
import com.hyend.dto.book.RentalResponse;
import com.hyend.security.UserPrincipal;
import com.hyend.service.BookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Books", description = "도서 대여 API")
@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {
    private final BookService bookService;

    @Operation(summary = "도서 목록 조회")
    @GetMapping
    public ApiResponse<List<BookResponse>> getAllBooks() {
        return ApiResponse.ok(bookService.getAllBooks());
    }

    @Operation(summary = "도서 단건 조회")
    @GetMapping("/{id}")
    public ApiResponse<BookResponse> getBook(@PathVariable Long id) {
        return ApiResponse.ok(bookService.getBook(id));
    }

    @Operation(summary = "도서 대출")
    @PostMapping("/rent")
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<RentalResponse> rentBook(
            @Valid @RequestBody RentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.ok(bookService.rentBook(request.bookId(), principal.getId()));
    }

    @Operation(summary = "도서 반납")
    @PostMapping("/return/{rentalId}")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<Void> returnBook(@PathVariable Long rentalId) {
        bookService.returnBook(rentalId);
        return ApiResponse.ok("반납이 완료되었습니다.");
    }

    @Operation(summary = "연체 여부 확인")
    @GetMapping("/overdue/{rentalId}")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<Boolean> isOverdue(@PathVariable Long rentalId) {
        return ApiResponse.ok(bookService.isOverdue(rentalId));
    }

    @Operation(summary = "내 대여 목록 조회")
    @GetMapping("/rentals/my")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<List<RentalResponse>> getMyRentals(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(bookService.getMyRentals(principal.getId()));
    }

    @Operation(summary = "대여 연장")
    @PostMapping("/rentals/{rentalId}/extend")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<RentalResponse> extendRental(
            @PathVariable Long rentalId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.ok(bookService.extendRental(rentalId, principal.getId()));
    }

    @Operation(summary = "대여 취소")
    @DeleteMapping("/rentals/{rentalId}")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<Void> cancelRental(
            @PathVariable Long rentalId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        bookService.cancelRental(rentalId, principal.getId());
        return ApiResponse.ok("대여가 취소되었습니다.");
    }
}
