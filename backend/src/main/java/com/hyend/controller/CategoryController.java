package com.hyend.controller;

import com.hyend.common.ApiResponse;
import com.hyend.dto.category.CategoryRequest;
import com.hyend.dto.category.CategoryResponse;
import com.hyend.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Categories", description = "카테고리 API")
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @Operation(summary = "카테고리 생성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok(categoryService.createCategory(request));
    }

    @Operation(summary = "카테고리 전체 조회")
    @GetMapping
    public ApiResponse<List<CategoryResponse>> getAllCategories() {
        return ApiResponse.ok(categoryService.getAllCategories());
    }

    @Operation(summary = "카테고리 단건 조회")
    @GetMapping("/{name}")
    public ApiResponse<CategoryResponse> getCategoryByName(@PathVariable String name) {
        return ApiResponse.ok(categoryService.getCategoryByName(name));
    }

    @Operation(summary = "카테고리 삭제")
    @DeleteMapping("/{categoryId}")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<Void> deleteCategory(@PathVariable Long categoryId) {
        categoryService.deleteCategory(categoryId);
        return ApiResponse.ok("카테고리가 삭제되었습니다.");
    }
}
