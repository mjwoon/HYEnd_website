package com.hyend.repository;

import com.hyend.entity.User;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserRepositoryTest {

    @MockitoBean
    RedisConnectionFactory redisConnectionFactory;

    @Autowired
    EntityManager em;

    @Autowired
    UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.save(User.of("student@hyend.com", "encodedPassword", "홍길동", User.Role.STUDENT));
        em.flush();
    }

    @Test
    @DisplayName("이메일로 사용자 조회 - 존재하는 경우 사용자 반환")
    void findByEmail_whenExists_returnsUser() {
        Optional<User> result = userRepository.findByEmail("student@hyend.com");

        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("student@hyend.com");
        assertThat(result.get().getName()).isEqualTo("홍길동");
        assertThat(result.get().getRole()).isEqualTo(User.Role.STUDENT);
    }

    @Test
    @DisplayName("이메일로 사용자 조회 - 존재하지 않는 경우 빈 Optional 반환")
    void findByEmail_whenNotExists_returnsEmpty() {
        Optional<User> result = userRepository.findByEmail("none@hyend.com");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("이메일 존재 여부 확인 - 존재하는 이메일이면 true 반환")
    void existsByEmail_whenExists_returnsTrue() {
        boolean exists = userRepository.existsByEmail("student@hyend.com");

        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("이메일 존재 여부 확인 - 존재하지 않는 이메일이면 false 반환")
    void existsByEmail_whenNotExists_returnsFalse() {
        boolean exists = userRepository.existsByEmail("none@hyend.com");

        assertThat(exists).isFalse();
    }

    @Test
    @DisplayName("사용자 저장 후 ID로 조회 - 저장된 정보 일치")
    void save_andFindById_persistsCorrectly() {
        User user = User.of("staff@hyend.com", "pass", "김철수", User.Role.STAFF);
        User saved = userRepository.save(user);
        em.flush();
        em.clear();

        Optional<User> found = userRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("staff@hyend.com");
        assertThat(found.get().getRole()).isEqualTo(User.Role.STAFF);
        assertThat(found.get().isActive()).isTrue();
    }

    @Test
    @DisplayName("전체 사용자 조회 - 저장된 모든 사용자 반환")
    void findAll_returnsAllSavedUsers() {
        userRepository.save(User.of("admin@hyend.com", "pass", "관리자", User.Role.ADMIN));
        em.flush();

        List<User> users = userRepository.findAll();

        assertThat(users).hasSizeGreaterThanOrEqualTo(2);
        assertThat(users).extracting(User::getEmail)
                .contains("student@hyend.com", "admin@hyend.com");
    }
}
