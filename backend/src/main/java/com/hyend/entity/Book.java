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

    public void decreaseAvailable() {
        if (this.availableCopies <= 0) {
            throw new IllegalStateException("대출 가능한 도서가 없습니다.");
        }
        this.availableCopies--;
    }

    public void increaseAvailable() {
        this.availableCopies++;
    }
}
