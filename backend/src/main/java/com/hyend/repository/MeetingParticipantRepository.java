package com.hyend.repository;

import com.hyend.entity.MeetingParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, Long> {
    List<MeetingParticipant> findByRoomIdAndLeftAtIsNull(Long roomId);
    Optional<MeetingParticipant> findByRoomIdAndUserIdAndLeftAtIsNull(Long roomId, Long userId);
    boolean existsByRoomIdAndUserId(Long roomId, Long userId);
}
