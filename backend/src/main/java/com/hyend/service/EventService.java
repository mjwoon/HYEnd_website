package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.event.EventRequest;
import com.hyend.dto.event.EventResponse;
import com.hyend.dto.file.AttachmentResponse;
import com.hyend.entity.Attachment;
import com.hyend.entity.Event;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.EventRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventService {
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final AttachmentService attachmentService;

    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public EventResponse createEvent(Long userId, EventRequest request) {
        User author = findUserById(userId);
        Event event = Event.of(
                request.title(),
                request.description(),
                request.location(),
                request.startTime(),
                request.endTime(),
                author
        );
        return toResponse(eventRepository.save(event));
    }

    @Cacheable("events")
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Cacheable(value = "events", key = "#id")
    public EventResponse getEvent(Long id) {
        return toResponse(findEventById(id));
    }

    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public EventResponse updateEvent(Long id, EventRequest request) {
        Event event = findEventById(id);
        event.update(
                request.title(),
                request.description(),
                request.location(),
                request.startTime(),
                request.endTime()
        );
        return toResponse(event);
    }

    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public void deleteEvent(Long id) {
        attachmentService.deleteByEntity(Attachment.EntityType.EVENT, id);
        eventRepository.delete(findEventById(id));
    }

    public List<AttachmentResponse> getAttachments(Long id) {
        findEventById(id);
        return attachmentService.findByEntity(Attachment.EntityType.EVENT, id);
    }

    private Event findEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    private EventResponse toResponse(Event event) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getLocation(),
                event.getStartTime(),
                event.getEndTime()
        );
    }
}
