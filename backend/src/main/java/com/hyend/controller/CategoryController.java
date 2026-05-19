package com.hyend.controller;

import com.hyend.dto.category.CategoryRequest;
import com.hyend.dto.category.CategoryResponse;
import com.hyend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// TODO [H-5] 카테고리 컨트롤러 구현
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    //카테고리 생성
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            @RequestBody CategoryRequest request
    ){
        return ResponseEntity.ok(
                categoryService.createCategory(request)
        );
    }

    //전체 조회
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(
                categoryService.getAllCategories()
        );
    }
    //단건 조회
    @GetMapping("/{name}")
    public ResponseEntity<CategoryResponse> getCategoryByName(
            @PathVariable String name
    ){
        return ResponseEntity.ok(
                categoryService.getCategoryByName(name)
        );
    }
    //삭제
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long categoryId
    ){
        categoryService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }
}
