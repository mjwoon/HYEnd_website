package com.hyend.repository;

import com.hyend.entity.MeetingRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MeetingRoomRepository extends JpaRepository<MeetingRoom, Long> {
    List<MeetingRoom> findByStatus(MeetingRoom.Status status);
    List<MeetingRoom> findByStatusNot(MeetingRoom.Status status);
    List<MeetingRoom> findByHostIdOrderByCreatedAtDesc(Long hostId);
    List<MeetingRoom> findAllByOrderByCreatedAtDesc();
}
