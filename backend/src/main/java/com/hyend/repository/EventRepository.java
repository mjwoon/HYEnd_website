package com.hyend.repository;

import com.hyend.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface EventRepository extends JpaRepository<Event, Long> {

    Page<Event> findByStartTimeBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<Event> findByStartTimeAfter(LocalDateTime from, Pageable pageable);
}
