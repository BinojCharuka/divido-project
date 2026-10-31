package com.divido.repository;

import com.divido.entity.Category;
import com.divido.entity.KakeiboGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    @Query("SELECT c FROM Category c WHERE (c.userId IS NULL OR c.userId = :userId) " +
            "AND (:activeOnly = false OR c.active = true) " +
            "AND (:group IS NULL OR c.group = :group) " +
            "ORDER BY CASE WHEN c.userId IS NULL THEN 0 ELSE 1 END, c.name ASC")
    List<Category> findUsableCategories(@Param("userId") UUID userId,
                                        @Param("activeOnly") boolean activeOnly,
                                        @Param("group") KakeiboGroup group);

    List<Category> findByUserIdIsNull();

    Optional<Category> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT COUNT(c) > 0 FROM Category c WHERE " +
            "((c.userId IS NULL) OR (c.userId = :userId)) " +
            "AND LOWER(TRIM(c.name)) = LOWER(TRIM(:name)) " +
            "AND (:excludeId IS NULL OR c.id != :excludeId)")
    boolean existsByNameForUserOrGlobal(@Param("userId") UUID userId,
                                        @Param("name") String name,
                                        @Param("excludeId") UUID excludeId);

    @Query("SELECT COUNT(c) > 0 FROM Category c WHERE " +
            "((c.userId IS NULL) OR (c.userId = :userId)) " +
            "AND c.slug = :slug " +
            "AND (:excludeId IS NULL OR c.id != :excludeId)")
    boolean existsBySlugForUserOrGlobal(@Param("userId") UUID userId,
                                        @Param("slug") String slug,
                                        @Param("excludeId") UUID excludeId);
}
