package com.divido.migration;

import com.divido.TestcontainersConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class TransactionSchemaMigrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private UUID userId;
    private UUID categoryId;
    private UUID incomeSourceId;

    @BeforeEach
    void setUp() {
        // Create an app_user for FK references
        userId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO app_users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)",
                userId, "tx-test-" + userId + "@example.com", "$2a$10$dummyHashPlaceholderForTest", "TX Test User"
        );

        // Fetch one of the seeded global categories (Groceries)
        categoryId = jdbcTemplate.queryForObject(
                "SELECT id FROM categories WHERE slug = 'groceries' AND user_id IS NULL",
                UUID.class
        );

        // Create an income source for the user
        incomeSourceId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO income_sources (id, user_id, name) VALUES (?, ?, ?)",
                incomeSourceId, userId, "Primary Job"
        );
    }

    @Test
    @DisplayName("Table 'transactions' and all required columns exist with expected types, limits, and nullability")
    void transactionsTableAndColumnsExist() {
        List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                "SELECT column_name, data_type, udt_name, character_maximum_length, numeric_precision, numeric_scale, is_nullable " +
                        "FROM information_schema.columns " +
                        "WHERE table_schema = 'public' AND table_name = 'transactions'"
        );

        assertThat(columns).isNotEmpty();

        Map<String, Map<String, Object>> columnMap = columns.stream()
                .collect(java.util.stream.Collectors.toMap(
                        row -> (String) row.get("column_name"),
                        row -> row
                ));

        assertThat(columnMap).containsKeys(
                "id", "user_id", "type", "amount", "transaction_date",
                "category_id", "income_source_id", "description",
                "payment_method", "created_at", "updated_at"
        );

        // UUID columns
        assertThat(columnMap.get("id").get("udt_name")).isEqualTo("uuid");
        assertThat(columnMap.get("user_id").get("udt_name")).isEqualTo("uuid");
        assertThat(columnMap.get("category_id").get("udt_name")).isEqualTo("uuid");
        assertThat(columnMap.get("income_source_id").get("udt_name")).isEqualTo("uuid");

        // VARCHAR columns and length limits
        assertThat(columnMap.get("type").get("udt_name")).isEqualTo("varchar");
        assertThat(((Number) columnMap.get("type").get("character_maximum_length")).intValue()).isEqualTo(20);

        assertThat(columnMap.get("description").get("udt_name")).isEqualTo("varchar");
        assertThat(((Number) columnMap.get("description").get("character_maximum_length")).intValue()).isEqualTo(500);

        assertThat(columnMap.get("payment_method").get("udt_name")).isEqualTo("varchar");
        assertThat(((Number) columnMap.get("payment_method").get("character_maximum_length")).intValue()).isEqualTo(50);

        // NUMERIC(12,2) precision and scale
        assertThat(columnMap.get("amount").get("udt_name")).isEqualTo("numeric");
        assertThat(((Number) columnMap.get("amount").get("numeric_precision")).intValue()).isEqualTo(12);
        assertThat(((Number) columnMap.get("amount").get("numeric_scale")).intValue()).isEqualTo(2);

        // DATE column
        assertThat(columnMap.get("transaction_date").get("udt_name")).isEqualTo("date");

        // TIMESTAMPTZ columns
        assertThat(columnMap.get("created_at").get("udt_name")).isEqualTo("timestamptz");
        assertThat(columnMap.get("updated_at").get("udt_name")).isEqualTo("timestamptz");

        // Required (NOT NULL) columns
        assertThat(columnMap.get("id").get("is_nullable")).isEqualTo("NO");
        assertThat(columnMap.get("user_id").get("is_nullable")).isEqualTo("NO");
        assertThat(columnMap.get("type").get("is_nullable")).isEqualTo("NO");
        assertThat(columnMap.get("amount").get("is_nullable")).isEqualTo("NO");
        assertThat(columnMap.get("transaction_date").get("is_nullable")).isEqualTo("NO");
        assertThat(columnMap.get("created_at").get("is_nullable")).isEqualTo("NO");
        assertThat(columnMap.get("updated_at").get("is_nullable")).isEqualTo("NO");

        // Nullable columns
        assertThat(columnMap.get("category_id").get("is_nullable")).isEqualTo("YES");
        assertThat(columnMap.get("income_source_id").get("is_nullable")).isEqualTo("YES");
        assertThat(columnMap.get("description").get("is_nullable")).isEqualTo("YES");
        assertThat(columnMap.get("payment_method").get("is_nullable")).isEqualTo("YES");

        // Verify DEC-014: no deleted_at column exists
        assertThat(columnMap).doesNotContainKey("deleted_at");
    }

    @Test
    @DisplayName("Valid INCOME record can be inserted without income source (DEC-003)")
    void validIncomeRecordWithoutIncomeSource() {
        UUID txId = UUID.randomUUID();
        int rows = jdbcTemplate.update(
                "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id, description) " +
                        "VALUES (?, ?, 'INCOME', 5000.00, '2026-10-15', NULL, NULL, 'Cash Gift')",
                txId, userId
        );

        assertThat(rows).isEqualTo(1);

        Map<String, Object> result = jdbcTemplate.queryForMap(
                "SELECT * FROM transactions WHERE id = ?", txId
        );
        assertThat(result.get("type")).isEqualTo("INCOME");
        assertThat(((BigDecimal) result.get("amount"))).isEqualByComparingTo("5000.00");
        assertThat(result.get("category_id")).isNull();
        assertThat(result.get("income_source_id")).isNull();
        assertThat(result.get("created_at")).isNotNull();
        assertThat(result.get("updated_at")).isNotNull();
    }

    @Test
    @DisplayName("Valid INCOME record can be inserted with income source")
    void validIncomeRecordWithIncomeSource() {
        UUID txId = UUID.randomUUID();
        int rows = jdbcTemplate.update(
                "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id, description) " +
                        "VALUES (?, ?, 'INCOME', 150000.00, '2026-10-01', NULL, ?, 'Monthly Salary')",
                txId, userId, incomeSourceId
        );

        assertThat(rows).isEqualTo(1);

        Map<String, Object> result = jdbcTemplate.queryForMap(
                "SELECT * FROM transactions WHERE id = ?", txId
        );
        assertThat(result.get("type")).isEqualTo("INCOME");
        assertThat(((BigDecimal) result.get("amount"))).isEqualByComparingTo("150000.00");
        assertThat(result.get("category_id")).isNull();
        assertThat(result.get("income_source_id")).isEqualTo(incomeSourceId);
    }

    @Test
    @DisplayName("Valid EXPENSE record can be inserted with category")
    void validExpenseRecordWithCategory() {
        UUID txId = UUID.randomUUID();
        int rows = jdbcTemplate.update(
                "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id, description, payment_method) " +
                        "VALUES (?, ?, 'EXPENSE', 2450.50, '2026-10-12', ?, NULL, 'Weekly Vegetables', 'CARD')",
                txId, userId, categoryId
        );

        assertThat(rows).isEqualTo(1);

        Map<String, Object> result = jdbcTemplate.queryForMap(
                "SELECT * FROM transactions WHERE id = ?", txId
        );
        assertThat(result.get("type")).isEqualTo("EXPENSE");
        assertThat(((BigDecimal) result.get("amount"))).isEqualByComparingTo("2450.50");
        assertThat(result.get("category_id")).isEqualTo(categoryId);
        assertThat(result.get("income_source_id")).isNull();
        assertThat(result.get("payment_method")).isEqualTo("CARD");
    }

    @Nested
    @DisplayName("Check Constraints Verification")
    class ConstraintTests {

        @Test
        @DisplayName("Invalid transaction type TRANSFER is rejected")
        void invalidTypeTransferRejected() {
            assertThatThrownBy(() -> jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id) " +
                            "VALUES (?, ?, 'TRANSFER', 1000.00, '2026-10-15', ?, NULL)",
                    UUID.randomUUID(), userId, categoryId
            )).isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("Lowercase transaction type 'expense' is rejected")
        void invalidTypeLowercaseRejected() {
            assertThatThrownBy(() -> jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id) " +
                            "VALUES (?, ?, 'expense', 1000.00, '2026-10-15', ?, NULL)",
                    UUID.randomUUID(), userId, categoryId
            )).isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("Zero amount is rejected")
        void zeroAmountRejected() {
            assertThatThrownBy(() -> jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id) " +
                            "VALUES (?, ?, 'EXPENSE', 0.00, '2026-10-15', ?, NULL)",
                    UUID.randomUUID(), userId, categoryId
            )).isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("Negative amount is rejected")
        void negativeAmountRejected() {
            assertThatThrownBy(() -> jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id) " +
                            "VALUES (?, ?, 'EXPENSE', -25.00, '2026-10-15', ?, NULL)",
                    UUID.randomUUID(), userId, categoryId
            )).isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("EXPENSE without category is rejected")
        void expenseWithoutCategoryRejected() {
            assertThatThrownBy(() -> jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id) " +
                            "VALUES (?, ?, 'EXPENSE', 500.00, '2026-10-15', NULL, NULL)",
                    UUID.randomUUID(), userId
            )).isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("EXPENSE with income source is rejected")
        void expenseWithIncomeSourceRejected() {
            assertThatThrownBy(() -> jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id) " +
                            "VALUES (?, ?, 'EXPENSE', 500.00, '2026-10-15', ?, ?)",
                    UUID.randomUUID(), userId, categoryId, incomeSourceId
            )).isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("INCOME with category is rejected")
        void incomeWithCategoryRejected() {
            assertThatThrownBy(() -> jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id) " +
                            "VALUES (?, ?, 'INCOME', 5000.00, '2026-10-15', ?, NULL)",
                    UUID.randomUUID(), userId, categoryId
            )).isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("Description exceeding 500 characters is rejected by VARCHAR(500) limit")
        void descriptionExceeding500CharsRejected() {
            String longDescription = "a".repeat(501);
            assertThatThrownBy(() -> jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id, description) " +
                            "VALUES (?, ?, 'EXPENSE', 100.00, '2026-10-15', ?, NULL, ?)",
                    UUID.randomUUID(), userId, categoryId, longDescription
            )).isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("Payment method exceeding 50 characters is rejected by VARCHAR(50) limit")
        void paymentMethodExceeding50CharsRejected() {
            String longPaymentMethod = "a".repeat(51);
            assertThatThrownBy(() -> jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id, payment_method) " +
                            "VALUES (?, ?, 'EXPENSE', 100.00, '2026-10-15', ?, NULL, ?)",
                    UUID.randomUUID(), userId, categoryId, longPaymentMethod
            )).isInstanceOf(DataIntegrityViolationException.class);
        }
    }

    @Nested
    @DisplayName("Foreign Key Constraints & Integrity")
    class ForeignKeyTests {

        @Test
        @DisplayName("Invalid user_id FK is rejected")
        void invalidUserIdRejected() {
            UUID nonExistentUser = UUID.randomUUID();
            assertThatThrownBy(() -> jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id) " +
                            "VALUES (?, ?, 'EXPENSE', 500.00, '2026-10-15', ?, NULL)",
                    UUID.randomUUID(), nonExistentUser, categoryId
            )).isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("Invalid category_id FK is rejected")
        void invalidCategoryIdRejected() {
            UUID nonExistentCategory = UUID.randomUUID();
            assertThatThrownBy(() -> jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id) " +
                            "VALUES (?, ?, 'EXPENSE', 500.00, '2026-10-15', ?, NULL)",
                    UUID.randomUUID(), userId, nonExistentCategory
            )).isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("Invalid income_source_id FK is rejected")
        void invalidIncomeSourceIdRejected() {
            UUID nonExistentIncomeSource = UUID.randomUUID();
            assertThatThrownBy(() -> jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id) " +
                            "VALUES (?, ?, 'INCOME', 500.00, '2026-10-15', NULL, ?)",
                    UUID.randomUUID(), userId, nonExistentIncomeSource
            )).isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("Deleting a category referenced by transactions is RESTRICTED to protect financial integrity")
        void deletingReferencedCategoryIsRestricted() {
            // Create a custom category for this test
            UUID customCatId = UUID.randomUUID();
            jdbcTemplate.update(
                    "INSERT INTO categories (id, user_id, name, slug, category_type) VALUES (?, ?, ?, ?, 'NEED')",
                    customCatId, userId, "Custom Transit", "custom-transit-" + customCatId
            );

            // Record a transaction against it
            jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id) " +
                            "VALUES (?, ?, 'EXPENSE', 100.00, '2026-10-15', ?, NULL)",
                    UUID.randomUUID(), userId, customCatId
            );

            // Attempting to delete the category must fail due to ON DELETE RESTRICT
            assertThatThrownBy(() -> jdbcTemplate.update(
                    "DELETE FROM categories WHERE id = ?", customCatId
            )).isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("Deleting an income source referenced by transactions is RESTRICTED to protect financial integrity")
        void deletingReferencedIncomeSourceIsRestricted() {
            // Record a transaction against incomeSourceId
            jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id) " +
                            "VALUES (?, ?, 'INCOME', 25000.00, '2026-10-15', NULL, ?)",
                    UUID.randomUUID(), userId, incomeSourceId
            );

            // Attempting to delete the income source must fail due to ON DELETE RESTRICT
            assertThatThrownBy(() -> jdbcTemplate.update(
                    "DELETE FROM income_sources WHERE id = ?", incomeSourceId
            )).isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        @DisplayName("Deleting a user CASCADE deletes their transactions")
        void deletingUserCascadesTransactions() {
            UUID tempUserId = UUID.randomUUID();
            jdbcTemplate.update(
                    "INSERT INTO app_users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)",
                    tempUserId, "cascade-" + tempUserId + "@example.com", "hash", "Cascade User"
            );
            UUID txId = UUID.randomUUID();
            jdbcTemplate.update(
                    "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id) " +
                            "VALUES (?, ?, 'EXPENSE', 100.00, '2026-10-15', ?, NULL)",
                    txId, tempUserId, categoryId
            );

            // Verify exists
            assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM transactions WHERE id = ?", Integer.class, txId))
                    .isEqualTo(1);

            // Delete user
            jdbcTemplate.update("DELETE FROM app_users WHERE id = ?", tempUserId);

            // Transactions should be deleted
            assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM transactions WHERE id = ?", Integer.class, txId))
                    .isEqualTo(0);
        }
    }

    @Test
    @DisplayName("Transaction permanent hard deletion succeeds (DEC-014)")
    void hardDeleteTransactionSucceeds() {
        UUID txId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO transactions (id, user_id, type, amount, transaction_date, category_id, income_source_id) " +
                        "VALUES (?, ?, 'EXPENSE', 320.00, '2026-10-15', ?, NULL)",
                txId, userId, categoryId
        );

        int deleted = jdbcTemplate.update("DELETE FROM transactions WHERE id = ?", txId);
        assertThat(deleted).isEqualTo(1);

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM transactions WHERE id = ?", Integer.class, txId
        );
        assertThat(count).isEqualTo(0);
    }

    @Test
    @DisplayName("Indexes for listing and filtering exist")
    void requiredIndexesExist() {
        List<String> indexes = jdbcTemplate.queryForList(
                "SELECT indexname FROM pg_indexes WHERE tablename = 'transactions'",
                String.class
        );

        assertThat(indexes).contains(
                "idx_transactions_user_date",
                "idx_transactions_user_type_date",
                "idx_transactions_category_id",
                "idx_transactions_income_source_id"
        );
    }
}
