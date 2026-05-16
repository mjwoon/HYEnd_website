package com.hyend.mapper;

import com.hyend.dto.inquiry.InquiryRequest;
import com.hyend.dto.inquiry.InquiryResponse;
import com.hyend.dto.inquiry.ReplyRequest;
import com.hyend.dto.inquiry.ReplyResponse;
import com.hyend.entity.Inquiry;
import com.hyend.entity.InquiryReply;
import org.mapstruct.Mapper;

// TODO [H-3] 문의 MapStruct Mapper 구현
@Mapper(componentModel="spring")
public interface InquiryMapper {
    Inquiry toEntity(InquiryRequest request);
    InquiryResponse toResponse(Inquiry inquiry);

    InquiryReply toEntity(ReplyRequest request);
    ReplyResponse toResponse(InquiryReply inquiry);

}
