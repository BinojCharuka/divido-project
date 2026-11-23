package com.divido.repository;

import com.divido.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
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

    /** Insights (DIV-027): number of distinct dates with at least one expense, both bounds inclusive. */
    @Query("""
            select count(distinct t.date) from Transaction t
            where t.userId = :userId and t.type = com.divido.entity.TransactionType.EXPENSE
              and t.date >= :from and t.date <= :to
            """)
    long countDistinctExpenseDays(@Param("userId") UUID userId,
                                  @Param("from") LocalDate from,
                                  @Param("to") LocalDate to);

    /**
     * Insights (DIV-027): expense count per category and date in a range, using each
     * category's current group (DEC-028). One row per category and day.
     */
    @Query("""
            select new com.divido.repository.CategoryDayCount(c.id, c.name, c.group, t.date, count(t))
            from Transaction t join t.category c
            where t.userId = :userId and t.type = com.divido.entity.TransactionType.EXPENSE
              and t.date >= :from and t.date <= :to
            group by c.id, c.name, c.group, t.date
            """)
    List<CategoryDayCount> countExpensesByCategoryAndDay(@Param("userId") UUID userId,
                                                         @Param("from") LocalDate from,
                                                         @Param("to") LocalDate to);

    /** Insights trend (DIV-027): expense totals per calendar month ({@code YYYY-MM}) in a range. */
    @Query(value = """
            SELECT to_char(transaction_date, 'YYYY-MM') AS month, SUM(amount) AS total
            FROM transactions
            WHERE user_id = :userId AND type = 'EXPENSE'
              AND transaction_date >= :from AND transaction_date <= :to
            GROUP BY to_char(transaction_date, 'YYYY-MM')
            """, nativeQuery = true)
    List<MonthExpenseTotal> sumExpensesByMonth(@Param("userId") UUID userId,
                                               @Param("from") LocalDate from,
                                               @Param("to") LocalDate to);

    /** Date of the user's earliest transaction of any type, or {@code null} when there is none. */
    @Query("select min(t.date) from Transaction t where t.userId = :userId")
    LocalDate findFirstTransactionDate(@Param("userId") UUID userId);

    /** Permanent deletion of all transactions belonging to a user. */
    @Modifying
    @Query("delete from Transaction t where t.userId = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
