package com.divido.repository;

import com.divido.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

    @EntityGraph(attributePaths = {"category", "incomeSource"})
    Optional<Transaction> findByIdAndUserId(UUID id, UUID userId);

    @Override
    @EntityGraph(attributePaths = {"category", "incomeSource"})
    Page<Transaction> findAll(Specification<Transaction> spec, Pageable pageable);

    /**
     * Dashboard aggregation (DIV-026): one grouped query, so no transaction rows are
     * loaded into Java. Income rows have no category and group under a null group;
     * expense rows group by their category's Kakeibo group. Both bounds are inclusive
     * date-only values. Hard-deleted rows (DEC-014) no longer exist and cannot count.
     */
    @Query("""
            select new com.divido.repository.MonthlyTransactionTotal(t.type, c.group, sum(t.amount), count(t))
            from Transaction t left join t.category c
            where t.userId = :userId and t.date >= :from and t.date <= :to
            group by t.type, c.group
            """)
    List<MonthlyTransactionTotal> aggregateByTypeAndGroup(@Param("userId") UUID userId,
                                                          @Param("from") LocalDate from,
                                                          @Param("to") LocalDate to);
}
