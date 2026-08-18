package com.hyend.repository;

import com.hyend.entity.MeetingTranscript;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MeetingTranscriptRepository extends JpaRepository<MeetingTranscript, Long> {
    List<MeetingTranscript> findByRoomIdOrderByChunkIndex(Long roomId);
}
