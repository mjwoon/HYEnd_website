package com.hyend.service;

import com.hyend.dto.category.CategoryRequest;
import com.hyend.dto.category.CategoryResponse;
import com.hyend.entity.Category;
import com.hyend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// TODO [H-5] 카테고리 서비스 구현 (Redis 캐싱 포함)
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    // 카테고리 생성
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {

        if (categoryRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("이미 존재하는 카테고리입니다.");
        }

        Category category = Category.of(
                request.name(),
                request.description()
        );

        Category saved = categoryRepository.save(category);

        return toResponse(saved);
    }

    // 전체 조회
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // 단건 조회 (이름 기준)
    public CategoryResponse getCategoryByName(String name) {

        Category category = categoryRepository.findByName(name)
                .orElseThrow(() ->
                        new IllegalArgumentException("카테고리를 찾을 수 없습니다.")
                );

        return toResponse(category);
    }

    // 삭제
    @Transactional
    public void deleteCategory(Long id) {

        Category category = findCategoryById(id);

        categoryRepository.delete(category);
    }

    // 내부 공통 조회
    private Category findCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("카테고리를 찾을 수 없습니다.")
                );
    }

    // DTO 변환
    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription()
        );
    }
}