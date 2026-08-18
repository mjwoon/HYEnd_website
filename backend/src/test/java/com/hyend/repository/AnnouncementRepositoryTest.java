package com.hyend.repository;

import com.hyend.entity.Announcement;
import com.hyend.entity.Category;
import com.hyend.entity.User;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AnnouncementRepositoryTest {

    @MockitoBean
    RedisConnectionFactory redisConnectionFactory;

    @Autowired
    EntityManager em;

    @Autowired
    AnnouncementRepository announcementRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    CategoryRepository categoryRepository;

    private User author;
    private Category category;

    @BeforeEach
    void setUp() {
        author = userRepository.save(User.of("author@hyend.com", "pass", "작성자", User.Role.STAFF));
        category = categoryRepository.save(Category.of("공지사항", "일반 공지"));
        em.flush();
    }

    @Test
    @DisplayName("카테고리 ID로 공지사항 페이징 조회 - 해당 카테고리 공지만 반환")
    void findByCategoryId_returnsOnlyMatchingCategory() {
        Category other = categoryRepository.save(Category.of("학사", "학사 공지"));
        announcementRepository.save(Announcement.of("공지 1", "내용 1", author, category));
        announcementRepository.save(Announcement.of("공지 2", "내용 2", author, category));
        announcementRepository.save(Announcement.of("학사 공지", "내용", author, other));
        em.flush();

        Page<Announcement> result = announcementRepository.findByCategoryId(category.getId(), PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent()).allMatch(a -> a.getCategory().getId().equals(category.getId()));
    }

    @Test
    @DisplayName("고정 공지사항 조회 - isPinned=true 인 항목만 반환")
    void findByIsPinnedTrue_returnsPinnedOnly() {
        Announcement pinned = Announcement.of("고정 공지", "중요 내용", author, category);
        pinned.pin();
        announcementRepository.save(pinned);
        announcementRepository.save(Announcement.of("일반 공지", "일반 내용", author, category));
        em.flush();

        List<Announcement> result = announcementRepository.findByIsPinnedTrue();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).isPinned()).isTrue();
        assertThat(result.get(0).getTitle()).isEqualTo("고정 공지");
    }

    @Test
    @DisplayName("제목 키워드 검색 - 대소문자 구분 없이 포함된 공지 반환")
    void findByTitleContainingIgnoreCase_matchesCaseInsensitive() {
        announcementRepository.save(Announcement.of("Spring Boot 입문", "내용", author, category));
        announcementRepository.save(Announcement.of("spring security 설정", "내용", author, category));
        announcementRepository.save(Announcement.of("JPA 활용", "내용", author, category));
        em.flush();

        Page<Announcement> result = announcementRepository.findByTitleContainingIgnoreCase(
                "spring", PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent()).extracting(Announcement::getTitle)
                .containsExactlyInAnyOrder("Spring Boot 입문", "spring security 설정");
    }

    @Test
    @DisplayName("제목 키워드 검색 - 일치하는 공지 없으면 빈 페이지 반환")
    void findByTitleContainingIgnoreCase_whenNoMatch_returnsEmpty() {
        announcementRepository.save(Announcement.of("JPA 활용", "내용", author, category));
        em.flush();

        Page<Announcement> result = announcementRepository.findByTitleContainingIgnoreCase(
                "없는키워드", PageRequest.of(0, 10));

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    @DisplayName("조회수 증가 - 호출 후 viewCount 1 증가")
    void incrementViewCount_increasesViewCountByOne() {
        Announcement saved = announcementRepository.save(Announcement.of("조회수 테스트", "내용", author, category));
        em.flush();
        em.clear();

        announcementRepository.incrementViewCount(saved.getId());
        em.clear();

        Announcement updated = announcementRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getViewCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("공지사항 내용 수정 - 제목·내용·카테고리 변경 반영")
    void update_changesFieldsCorrectly() {
        Category newCategory = categoryRepository.save(Category.of("학사", "학사 공지"));
        Announcement saved = announcementRepository.save(Announcement.of("원래 제목", "원래 내용", author, category));
        em.flush();

        saved.update("수정된 제목", "수정된 내용", newCategory);
        em.flush();
        em.clear();

        Announcement updated = announcementRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getTitle()).isEqualTo("수정된 제목");
        assertThat(updated.getContent()).isEqualTo("수정된 내용");
        assertThat(updated.getCategory().getId()).isEqualTo(newCategory.getId());
    }

    @Test
    @DisplayName("고정 공지 해제 - unpin 후 findByIsPinnedTrue 결과에서 제외")
    void unpin_removesFromPinnedList() {
        Announcement pinned = Announcement.of("고정 공지", "내용", author, category);
        pinned.pin();
        Announcement saved = announcementRepository.save(pinned);
        em.flush();

        saved.unpin();
        em.flush();
        em.clear();

        List<Announcement> result = announcementRepository.findByIsPinnedTrue();
        assertThat(result).isEmpty();
    }
}
