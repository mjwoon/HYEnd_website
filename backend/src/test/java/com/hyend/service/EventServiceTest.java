package com.hyend.service;

import com.hyend.dto.event.EventRequest;
import com.hyend.entity.Event;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.EventRepository;
import com.hyend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock EventRepository eventRepository;
    @Mock UserRepository userRepository;
    @Mock AttachmentService attachmentService;
    @InjectMocks EventService eventService;

    private EventRequest sampleRequest() {
        return new EventRequest("행사 제목", "행사 설명", "장소", LocalDateTime.now(), LocalDateTime.now().plusDays(1));
    }

    @Test
    @DisplayName("행사 생성 - 성공")
    void createEvent_success() {
        User author = mock(User.class);
        Event event = mock(Event.class);

        given(userRepository.findById(1L)).willReturn(Optional.of(author));
        given(eventRepository.save(any(Event.class))).willReturn(event);

        assertThatCode(() -> eventService.createEvent(1L, sampleRequest())).doesNotThrowAnyException();
        then(eventRepository).should().save(any(Event.class));
    }

    @Test
    @DisplayName("행사 생성 - 사용자 없음")
    void createEvent_userNotFound() {
        given(userRepository.findById(1L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.createEvent(1L, sampleRequest()))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("행사 목록 조회 - 성공")
    void getAllEvents_success() {
        Event event = mock(Event.class);
        given(eventRepository.findAll()).willReturn(List.of(event));

        assertThatCode(() -> eventService.getAllEvents()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("행사 단건 조회 - 없음")
    void getEvent_notFound() {
        given(eventRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.getEvent(99L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("행사 수정 - 성공")
    void updateEvent_success() {
        Event event = mock(Event.class);
        given(eventRepository.findById(1L)).willReturn(Optional.of(event));

        assertThatCode(() -> eventService.updateEvent(1L, sampleRequest())).doesNotThrowAnyException();
        then(event).should().update(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("행사 삭제 - 성공")
    void deleteEvent_success() {
        Event event = mock(Event.class);
        given(eventRepository.findById(1L)).willReturn(Optional.of(event));

        assertThatCode(() -> eventService.deleteEvent(1L)).doesNotThrowAnyException();
        then(eventRepository).should().delete(event);
    }
}
