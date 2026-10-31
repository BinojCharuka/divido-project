package com.divido.service;

import com.divido.dto.CategoryCreateRequest;
import com.divido.dto.CategoryResponse;
import com.divido.dto.CategoryUpdateRequest;
import com.divido.entity.Category;
import com.divido.entity.KakeiboGroup;
import com.divido.exception.ConflictException;
import com.divido.exception.FieldValidationException;
import com.divido.exception.ForbiddenOperationException;
import com.divido.exception.ResourceNotFoundException;
import com.divido.repository.CategoryRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listUsableCategories(UUID userId, boolean includeInactive, KakeiboGroup group) {
        return categoryRepository.findUsableCategories(userId, !includeInactive, group).stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    public CategoryResponse createCustomCategory(UUID userId, CategoryCreateRequest request) {
        String normalizedName = request.name().trim();
        if (categoryRepository.existsByNameForUserOrGlobal(userId, normalizedName, null)) {
            throw new ConflictException("A category named '" + normalizedName + "' already exists.");
        }

        String slug = generateUniqueSlug(userId, normalizedName, null);
        Category category = new Category(userId, normalizedName, slug, request.group());
        try {
            Category saved = categoryRepository.saveAndFlush(category);
            return CategoryResponse.fromEntity(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("A category named '" + normalizedName + "' already exists.");
        }
    }

    public CategoryResponse updateCategory(UUID userId, UUID categoryId, CategoryUpdateRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found."));

        if (category.isDefault()) {
            throw new ForbiddenOperationException("Global default categories cannot be modified.");
        }

        if (!category.getUserId().equals(userId)) {
            // Do not disclose another user's category existence
            throw new ResourceNotFoundException("Category not found.");
        }

        if (request.name() != null) {
            String newName = request.name().trim();
            if (newName.isEmpty()) {
                throw new FieldValidationException("name", "Category name cannot be blank.");
            }
            if (!newName.equalsIgnoreCase(category.getName())) {
                if (categoryRepository.existsByNameForUserOrGlobal(userId, newName, categoryId)) {
                    throw new ConflictException("A category named '" + newName + "' already exists.");
                }
                category.setName(newName);
                category.setSlug(generateUniqueSlug(userId, newName, categoryId));
            }
        }

        if (request.group() != null) {
            category.setGroup(request.group());
        }

        category.setUpdatedAt(Instant.now());
        try {
            Category saved = categoryRepository.saveAndFlush(category);
            return CategoryResponse.fromEntity(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("A category with this name or slug already exists.");
        }
    }

    public void deactivateCategory(UUID userId, UUID categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found."));

        if (category.isDefault()) {
            throw new ForbiddenOperationException("Global default categories cannot be deactivated.");
        }

        if (!category.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Category not found.");
        }

        category.setActive(false);
        category.setUpdatedAt(Instant.now());
        categoryRepository.save(category);
    }

    public String generateUniqueSlug(UUID userId, String name, UUID excludeId) {
        String base = slugify(name);
        if (base.isEmpty()) {
            base = "category";
        }
        if (base.length() > 90) {
            base = base.substring(0, 90).replaceAll("-+$", "");
        }
        String candidate = base;
        int counter = 2;
        while (categoryRepository.existsBySlugForUserOrGlobal(userId, candidate, excludeId)) {
            candidate = base + "-" + counter;
            counter++;
        }
        return candidate;
    }

    public static String slugify(String input) {
        if (input == null) {
            return "";
        }
        // Normalize diacritics/accents (e.g. Café -> Cafe)
        String decomp = Normalizer.normalize(input.trim(), Normalizer.Form.NFD);
        String noAccents = decomp.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String normalized = noAccents.toLowerCase(Locale.ROOT);
        String slug = normalized.replaceAll("[^a-z0-9]+", "-");
        slug = slug.replaceAll("^-+|-+$", "");
        return slug;
    }
}
