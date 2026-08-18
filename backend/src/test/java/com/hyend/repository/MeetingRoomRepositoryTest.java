package com.hyend.repository;

import com.hyend.entity.MeetingRoom;
import com.hyend.entity.User;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MeetingRoomRepositoryTest {

    @Autowired EntityManager em;
    @Autowired MeetingRoomRepository roomRepository;
    @MockitoBean RedisConnectionFactory redisConnectionFactory;

    @Test
    void findByStatus_returnsOnlyMatchingRooms() {
        User host = User.of("host@test.com", "encoded-pw", "테스터", User.Role.STUDENT);
        em.persist(host);

        MeetingRoom active = MeetingRoom.of("활성 회의", null, host, "room-uuid-1");
        active.activate();
        MeetingRoom waiting = MeetingRoom.of("대기 회의", null, host, "room-uuid-2");
        em.persist(active);
        em.persist(waiting);
        em.flush();

        List<MeetingRoom> result = roomRepository.findByStatus(MeetingRoom.Status.ACTIVE);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("활성 회의");
    }
}
