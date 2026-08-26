package com.hyend.repository;

import com.hyend.entity.MeetingChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MeetingChatMessageRepository extends JpaRepository<MeetingChatMessage, Long> {
    List<MeetingChatMessage> findTop100ByRoomIdOrderByCreatedAtAsc(Long roomId);
}
