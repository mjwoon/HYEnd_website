package com.hyend.mapper;

import com.hyend.dto.announcement.AnnouncementRequest;
import com.hyend.dto.announcement.AnnouncementResponse;
import com.hyend.dto.announcement.AnnouncementSummary;
import com.hyend.entity.Announcement;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AnnouncementMapper {
        @org.mapstruct.Mapping(source = "category.name", target = "category")
        @org.mapstruct.Mapping(source = "author.name", target = "writer")
        @org.mapstruct.Mapping(source = "pinned", target = "isImportant")
        AnnouncementResponse toResponse(Announcement announcement);

        AnnouncementSummary toSummary(Announcement announcement);
}