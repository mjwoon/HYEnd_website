package com.hyend.service;

import com.hyend.dto.category.CategoryRequest;
import com.hyend.entity.Category;
import com.hyend.exception.BusinessException;
import com.hyend.repository.CategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock CategoryRepository categoryRepository;
    @InjectMocks CategoryService categoryService;

    @Test
    @DisplayName("카테고리 생성 - 성공")
    void createCategory_success() {
        CategoryRequest request = new CategoryRequest("공모전", "공모전 카테고리");

        given(categoryRepository.existsByName("공모전")).willReturn(false);
        given(categoryRepository.save(any(Category.class))).willAnswer(i -> i.getArgument(0));

        assertThatCode(() -> categoryService.createCategory(request)).doesNotThrowAnyException();
        then(categoryRepository).should().save(any(Category.class));
    }

    @Test
    @DisplayName("카테고리 생성 - 중복 이름")
    void createCategory_duplicate() {
        CategoryRequest request = new CategoryRequest("공모전", "중복");
        given(categoryRepository.existsByName("공모전")).willReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(request))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("카테고리 전체 조회 - 성공")
    void getAllCategories_success() {
        Category cat = mock(Category.class);
        given(categoryRepository.findAll()).willReturn(List.of(cat));

        assertThatCode(() -> categoryService.getAllCategories()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("카테고리 이름 조회 - 없음")
    void getCategoryByName_notFound() {
        given(categoryRepository.findByName("없음")).willReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.getCategoryByName("없음"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("카테고리 삭제 - 성공")
    void deleteCategory_success() {
        Category cat = mock(Category.class);
        given(categoryRepository.findById(1L)).willReturn(Optional.of(cat));

        assertThatCode(() -> categoryService.deleteCategory(1L)).doesNotThrowAnyException();
        then(categoryRepository).should().delete(cat);
    }

    @Test
    @DisplayName("카테고리 삭제 - 없음")
    void deleteCategory_notFound() {
        given(categoryRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.deleteCategory(99L))
                .isInstanceOf(BusinessException.class);
    }
}
