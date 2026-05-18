package com.hyend.service;

import com.hyend.dto.event.EventRequest;
import com.hyend.dto.event.EventResponse;
import com.hyend.entity.Event;
import com.hyend.entity.User;
import com.hyend.repository.CategoryRepository;
import com.hyend.repository.EventRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// TODO [H-6] 행사 서비스 구현
@Service
@RequiredArgsConstructor
@Transactional(readOnly=true)
public class EventService {
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    //이벤트 생성
    @Transactional
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

        Event saved = eventRepository.save(event);

        return toResponse(saved);
    }

    //전체 조회
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    //단건 조회
    public EventResponse getEvent(Long id) {
        Event event = findEventById(id);
        return toResponse(event);
    }

    //수정
    @Transactional
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
    // 삭제
    @Transactional
    public void deleteEvent(Long id) {
        Event event = findEventById(id);
        eventRepository.delete(event);
    }

    //필요 메서드
    private Event findEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("이벤트를 찾을 수 없습니다.")
                );
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("사용자를 찾을 수 없습니다.")
                );
    }

    private EventResponse toResponse(Event event) {
        return new EventResponse(
                event.getId(),
                event.getDescription(),
                event.getLocation(),
                event.getStartTime(),
                event.getEndTime()
        );
    }
}
