package com.hyend.service;

import com.hyend.entity.Book;
import com.hyend.entity.BookRental;
import com.hyend.entity.User;
import com.hyend.repository.BookRentalRepository;
import com.hyend.repository.BookRepository;
import com.hyend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 재고가 1권인 도서에 여러 사용자가 동시에 대출을 시도해도
 * 재고 초과 대출(oversell)이 발생하지 않는지 검증한다.
 */
@SpringBootTest
@ActiveProfiles("test")
class BookConcurrencyTest {

    @Autowired BookService bookService;
    @Autowired BookRepository bookRepository;
    @Autowired UserRepository userRepository;
    @Autowired BookRentalRepository bookRentalRepository;

    // @CacheEvict가 Redis에 접근하지 않도록 인메모리 캐시 매니저로 대체한다.
    @TestConfiguration
    static class CacheOverrideConfig {
        @Bean
        @Primary
        CacheManager testCacheManager() {
            return new ConcurrentMapCacheManager("books", "events", "announcements", "categories");
        }
    }

    @Test
    void concurrentRent_neverOversellsSingleCopy() throws InterruptedException {
        Book book = bookRepository.save(Book.of("동시성 테스트 도서", "저자", "isbn-conc-1", 1));

        int threadCount = 20;
        List<Long> userIds = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            User user = userRepository.save(
                    User.of("conc" + i + "@test.com", "pw", "user" + i, User.Role.STUDENT));
            userIds.add(user.getId());
        }

        ExecutorService pool = Executors.newFixedThreadPool(threadCount);
        CountDownLatch ready = new CountDownLatch(threadCount);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threadCount);
        AtomicInteger success = new AtomicInteger();

        for (Long userId : userIds) {
            pool.submit(() -> {
                ready.countDown();
                try {
                    start.await();
                    bookService.rentBook(book.getId(), userId);
                    success.incrementAndGet();
                } catch (Exception ignored) {
                    // 재고 없음 등 실패는 정상 (성공은 정확히 1건이어야 함)
                } finally {
                    done.countDown();
                }
            });
        }

        ready.await();
        start.countDown();               // 모든 스레드 동시 출발
        done.await(10, TimeUnit.SECONDS);
        pool.shutdownNow();

        Book reloaded = bookRepository.findById(book.getId()).orElseThrow();
        assertThat(success.get()).isEqualTo(1);
        assertThat(reloaded.getAvailableCopies()).isEqualTo(0);
    }

    @Test
    void concurrentReturn_incrementsStockExactlyOnce() throws InterruptedException {
        Book book = bookRepository.save(Book.of("반납 동시성 도서", "저자", "isbn-conc-2", 1));
        User user = userRepository.save(User.of("return@test.com", "pw", "user", User.Role.STUDENT));
        bookService.rentBook(book.getId(), user.getId());   // availableCopies 1 -> 0
        Long rentalId = bookRentalRepository
                .findByUserIdAndStatus(user.getId(), BookRental.RentalStatus.ACTIVE)
                .get(0).getId();

        int threadCount = 20;
        ExecutorService pool = Executors.newFixedThreadPool(threadCount);
        CountDownLatch ready = new CountDownLatch(threadCount);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threadCount);
        AtomicInteger success = new AtomicInteger();

        for (int i = 0; i < threadCount; i++) {
            pool.submit(() -> {
                ready.countDown();
                try {
                    start.await();
                    bookService.returnBook(rentalId);   // 같은 대여를 동시에 반납 시도
                    success.incrementAndGet();
                } catch (Exception ignored) {
                    // 이미 반납됨 등 실패는 정상 (성공은 정확히 1건)
                } finally {
                    done.countDown();
                }
            });
        }

        ready.await();
        start.countDown();
        done.await(10, TimeUnit.SECONDS);
        pool.shutdownNow();

        Book reloaded = bookRepository.findById(book.getId()).orElseThrow();
        assertThat(success.get()).isEqualTo(1);
        assertThat(reloaded.getAvailableCopies()).isEqualTo(1);   // over-count 없이 정확히 1회 증가
    }
}
