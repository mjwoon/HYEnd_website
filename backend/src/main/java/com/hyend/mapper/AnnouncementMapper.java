package com.hyend.mapper;

import com.hyend.dto.announcement.AnnouncementRequest;
import com.hyend.dto.announcement.AnnouncementResponse;
import com.hyend.dto.announcement.AnnouncementSummary;
import com.hyend.entity.Announcement;
import org.mapstruct.Mapper;

// TODO [H-3] 공지사항 MapStruct Mapper 구현
@Mapper(componentModel = "spring")
public interface AnnouncementMapper {
        Announcement toEntity(AnnouncementRequest request);
        AnnouncementResponse toResponse(Announcement announcement);
        AnnouncementSummary toSummary(Announcement announcement);

}