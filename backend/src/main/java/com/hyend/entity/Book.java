package com.hyend.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "books")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Book extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @Column(nullable = false)
    private String isbn;

    @Column(nullable = false)
    private int totalCopies = 1;

    @Column(nullable = false)
    private int availableCopies = 1;

    public static Book of(String title, String author, String isbn, int totalCopies) {
        Book book = new Book();
        book.title = title;
        book.author = author;
        book.isbn = isbn;
        book.totalCopies = totalCopies;
        book.availableCopies = totalCopies;
        return book;
    }

    // 재고 감소는 동시성 안전을 위해 BookRepository.decrementAvailableIfPositive(원자적 UPDATE)로 처리한다.

    public void increaseAvailable() {
        this.availableCopies++;
    }
}
