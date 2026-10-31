package com.divido.repository;

import com.divido.entity.IncomeSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IncomeSourceRepository extends JpaRepository<IncomeSource, UUID> {

    @Query("SELECT s FROM IncomeSource s WHERE s.userId = :userId " +
            "AND (:activeOnly = false OR s.active = true) " +
            "ORDER BY s.name ASC")
    List<IncomeSource> findByUserId(@Param("userId") UUID userId, @Param("activeOnly") boolean activeOnly);

    Optional<IncomeSource> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT COUNT(s) > 0 FROM IncomeSource s WHERE s.userId = :userId " +
            "AND LOWER(TRIM(s.name)) = LOWER(TRIM(:name)) " +
            "AND (:excludeId IS NULL OR s.id != :excludeId)")
    boolean existsByNameForUser(@Param("userId") UUID userId,
                                @Param("name") String name,
                                @Param("excludeId") UUID excludeId);
}
