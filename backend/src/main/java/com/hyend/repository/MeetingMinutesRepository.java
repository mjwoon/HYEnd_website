package com.hyend.repository;

import com.hyend.entity.MeetingMinutes;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MeetingMinutesRepository extends JpaRepository<MeetingMinutes, Long> {
    Optional<MeetingMinutes> findByRoomId(Long roomId);
}
