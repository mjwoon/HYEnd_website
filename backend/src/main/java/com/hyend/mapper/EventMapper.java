package com.hyend.mapper;

import com.hyend.dto.event.EventRequest;
import com.hyend.dto.event.EventResponse;
import com.hyend.entity.Event;
import org.mapstruct.Mapper;

// TODO [H-3] 행사 MapStruct Mapper 구현
@Mapper(componentModel="spring")
public interface EventMapper {
    Event toEntity(EventRequest request);
    EventResponse toResponse(Event event);
}
