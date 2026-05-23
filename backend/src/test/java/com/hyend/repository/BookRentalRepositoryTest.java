package com.hyend.repository;

import com.hyend.entity.BookRental;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;


import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

// TODO [H-9] BookRentalRepository 통합 테스트 작성
@ExtendWith(MockitoExtension.class)
class BookRentalRepositoryTest {

    @Mock
    BookRentalRepository bookRentalRepository;

    @Test
    @DisplayName("사용자와 도서, 상태로 대출 여부 조회 - 존재함")
    void existsByUserIdAndBookIdAndStatus_true() {

        // given
        given(bookRentalRepository.existsByUserIdAndBookIdAndStatus(
                1L,
                1L,
                BookRental.RentalStatus.ACTIVE
        )).willReturn(true);

        // when
        boolean result = bookRentalRepository.existsByUserIdAndBookIdAndStatus(
                1L,
                1L,
                BookRental.RentalStatus.ACTIVE
        );

        // then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("사용자와 도서, 상태로 대출 여부 조회 - 존재하지 않음")
    void existsByUserIdAndBookIdAndStatus_false() {

        // given
        given(bookRentalRepository.existsByUserIdAndBookIdAndStatus(
                1L,
                2L,
                BookRental.RentalStatus.ACTIVE
        )).willReturn(false);

        // when
        boolean result = bookRentalRepository.existsByUserIdAndBookIdAndStatus(
                1L,
                2L,
                BookRental.RentalStatus.ACTIVE
        );

        // then
        assertThat(result).isFalse();
    }
}