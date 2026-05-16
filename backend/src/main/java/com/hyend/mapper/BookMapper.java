package com.hyend.mapper;

import com.hyend.dto.book.BookResponse;
import com.hyend.dto.book.RentRequest;
import com.hyend.dto.book.RentalResponse;
import com.hyend.entity.Book;
import com.hyend.entity.BookRental;
import org.mapstruct.Mapper;

// TODO [H-3] 도서 MapStruct Mapper 구현
@Mapper(componentModel = "spring")
public interface BookMapper {
    BookResponse toResponse(Book book);
    RentalResponse toResponse(BookRental rental);
    BookRental toEntity(RentRequest rental);
}
