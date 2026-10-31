package com.divido.repository;

import com.divido.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

    @EntityGraph(attributePaths = {"category", "incomeSource"})
    Optional<Transaction> findByIdAndUserId(UUID id, UUID userId);

    @Override
    @EntityGraph(attributePaths = {"category", "incomeSource"})
    Page<Transaction> findAll(Specification<Transaction> spec, Pageable pageable);
}
