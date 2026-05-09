package com.hyend.service;

import com.hyend.common.ErrorCode;
import com.hyend.dto.announcement.AnnouncementRequest;
import com.hyend.dto.announcement.AnnouncementResponse;
import com.hyend.dto.announcement.AnnouncementSummary;
import com.hyend.entity.Announcement;
import com.hyend.entity.Category;
import com.hyend.entity.User;
import com.hyend.exception.BusinessException;
import com.hyend.repository.AnnouncementRepository;
import com.hyend.repository.CategoryRepository;
import com.hyend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Cacheable(value = "announcements", key = "'list:' + #pageable.pageNumber + ':' + #pageable.pageSize")
    public Page<AnnouncementSummary> getList(Pageable pageable) {
        return announcementRepository.findAll(pageable).map(this::toSummary);
    }

    @Cacheable(value = "announcements", key = "'cat:' + #categoryId + ':' + #pageable.pageNumber + ':' + #pageable.pageSize")
    public Page<AnnouncementSummary> getByCategory(Long categoryId, Pageable pageable) {
        return announcementRepository.findByCategoryId(categoryId, pageable).map(this::toSummary);
    }

    public Page<AnnouncementSummary> search(String keyword, Pageable pageable) {
        return announcementRepository.findByTitleContainingIgnoreCase(keyword, pageable).map(this::toSummary);
    }

    @Cacheable(value = "announcements", key = "'pinned'")
    public List<AnnouncementSummary> getPinned() {
        return announcementRepository.findByIsPinnedTrue().stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public AnnouncementResponse getDetail(Long id) {
        Announcement announcement = find(id);
        announcementRepository.incrementViewCount(id);
        return toResponse(announcement, announcement.getViewCount() + 1);
    }

    @Transactional
    @CacheEvict(value = "announcements", allEntries = true)
    public AnnouncementResponse create(AnnouncementRequest request, Long authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Category category = resolveCategory(request.category());

        Announcement announcement = Announcement.of(request.title(), request.content(), author, category);
        if (request.isImportant()) {
            announcement.pin();
        }
        return toResponse(announcementRepository.save(announcement));
    }

    @Transactional
    @CacheEvict(value = "announcements", allEntries = true)
    public AnnouncementResponse update(Long id, AnnouncementRequest request) {
        Announcement announcement = find(id);
        Category category = resolveCategory(request.category());

        announcement.update(request.title(), request.content(), category);
        if (request.isImportant() && !announcement.isPinned()) {
            announcement.pin();
        } else if (!request.isImportant() && announcement.isPinned()) {
            announcement.unpin();
        }
        return toResponse(announcement);
    }

    @Transactional
    @CacheEvict(value = "announcements", allEntries = true)
    public void delete(Long id) {
        announcementRepository.delete(find(id));
    }

    @Transactional
    @CacheEvict(value = "announcements", allEntries = true)
    public void pin(Long id) {
        find(id).pin();
    }

    @Transactional
    @CacheEvict(value = "announcements", allEntries = true)
    public void unpin(Long id) {
        find(id).unpin();
    }

    private Announcement find(Long id) {
        return announcementRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ANNOUNCEMENT_NOT_FOUND));
    }

    private Category resolveCategory(String name) {
        return categoryRepository.findByName(name)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
    }

    private AnnouncementSummary toSummary(Announcement a) {
        return new AnnouncementSummary(a.getId(), a.getTitle(), a.getCreatedAt(), a.getUpdatedAt());
    }

    private AnnouncementResponse toResponse(Announcement a) {
        return toResponse(a, a.getViewCount());
    }

    private AnnouncementResponse toResponse(Announcement a, int viewCount) {
        return new AnnouncementResponse(
                a.getId(),
                a.getTitle(),
                a.getContent(),
                a.getCategory().getName(),
                a.getAuthor().getName(),
                a.isPinned(),
                viewCount,
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
