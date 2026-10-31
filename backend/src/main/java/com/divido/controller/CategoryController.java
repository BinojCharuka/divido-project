package com.divido.controller;

import com.divido.dto.CategoryCreateRequest;
import com.divido.dto.CategoryListResponse;
import com.divido.dto.CategoryResponse;
import com.divido.dto.CategoryUpdateRequest;
import com.divido.entity.KakeiboGroup;
import com.divido.security.DividoUserDetails;
import com.divido.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public CategoryListResponse listCategories(
            @RequestParam(defaultValue = "false") boolean includeInactive,
            @RequestParam(required = false) KakeiboGroup group,
            @AuthenticationPrincipal DividoUserDetails user) {
        return new CategoryListResponse(categoryService.listUsableCategories(user.getId(), includeInactive, group));
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            @Valid @RequestBody CategoryCreateRequest request,
            @AuthenticationPrincipal DividoUserDetails user) {
        CategoryResponse response = categoryService.createCustomCategory(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable UUID categoryId,
            @Valid @RequestBody CategoryUpdateRequest request,
            @AuthenticationPrincipal DividoUserDetails user) {
        CategoryResponse response = categoryService.updateCategory(user.getId(), categoryId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{categoryId}/deactivate")
    public ResponseEntity<Void> deactivateCategory(
            @PathVariable UUID categoryId,
            @AuthenticationPrincipal DividoUserDetails user) {
        categoryService.deactivateCategory(user.getId(), categoryId);
        return ResponseEntity.noContent().build();
    }
}
