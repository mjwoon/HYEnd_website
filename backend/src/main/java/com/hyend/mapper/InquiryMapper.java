package com.hyend.mapper;

import com.hyend.dto.inquiry.InquiryRequest;
import com.hyend.dto.inquiry.InquiryResponse;
import com.hyend.dto.inquiry.ReplyRequest;
import com.hyend.dto.inquiry.ReplyResponse;
import com.hyend.entity.Inquiry;
import com.hyend.entity.InquiryReply;
import org.mapstruct.Mapper;

@Mapper(componentModel="spring")
public interface InquiryMapper {
    @org.mapstruct.Mapping(source = "id", target = "inquiryId")
    @org.mapstruct.Mapping(target = "category", ignore = true)
    InquiryResponse toResponse(Inquiry inquiry);

    @org.mapstruct.Mapping(source = "id", target = "replyId")
    @org.mapstruct.Mapping(source = "author.name", target = "writer")
    ReplyResponse toResponse(InquiryReply inquiry);

}
