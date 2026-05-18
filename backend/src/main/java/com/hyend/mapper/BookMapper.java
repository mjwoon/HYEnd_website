package com.hyend.mapper;

import com.hyend.dto.book.BookResponse;
import com.hyend.dto.book.RentRequest;
import com.hyend.dto.book.RentalResponse;
import com.hyend.entity.Book;
import com.hyend.entity.BookRental;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BookMapper {
    @org.mapstruct.Mapping(source = "id", target = "bookId")
    @org.mapstruct.Mapping(target = "category", ignore = true)
    @org.mapstruct.Mapping(target = "summary", ignore = true)
    @org.mapstruct.Mapping(target = "imageUrl", ignore = true)
    @org.mapstruct.Mapping(expression = "java(book.getAvailableCopies() > 0)", target = "isAvailable")
    BookResponse toResponse(Book book);

    @org.mapstruct.Mapping(source = "book.id", target = "bookId")
    @org.mapstruct.Mapping(source = "book.title", target = "title")
    @org.mapstruct.Mapping(source = "book.author", target = "author")
    @org.mapstruct.Mapping(target = "category", ignore = true)
    @org.mapstruct.Mapping(expression = "java(rental.getBook().getAvailableCopies() > 0)", target = "isAvailable")
    @org.mapstruct.Mapping(source = "rentedAt", target = "startDate")
    @org.mapstruct.Mapping(source = "dueDate", target = "endDate")
    RentalResponse toResponse(BookRental rental);
}
