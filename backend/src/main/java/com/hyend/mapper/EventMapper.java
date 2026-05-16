package com.hyend.mapper;

import com.hyend.dto.event.EventRequest;
import com.hyend.dto.event.EventResponse;
import com.hyend.entity.Event;
import org.mapstruct.Mapper;

@Mapper(componentModel="spring")
public interface EventMapper {
    @org.mapstruct.Mapping(source = "id", target = "eventId")
    @org.mapstruct.Mapping(source = "description", target = "content")
    @org.mapstruct.Mapping(source = "startTime", target = "startDate")
    @org.mapstruct.Mapping(source = "endTime", target = "endDate")
    EventResponse toResponse(Event event);
}
