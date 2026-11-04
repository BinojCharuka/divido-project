package com.divido.controller;

import com.divido.TestcontainersConfiguration;
import com.divido.dto.MonthlyBudgetRequest;
import com.divido.service.BudgetService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static com.divido.ApiSession.delete;
import static com.divido.ApiSession.get;
import static com.divido.ApiSession.put;
import static com.divido.ApiSession.registerAndLogin;
import static org.assertj.core.api.Assertions.assertThat;

/** DIV-025: BUDGET-001/002 against a disposable PostgreSQL with Flyway V1-V4. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class BudgetIntegrationTest {

    private static final String REFERENCE_PLAN = """
            {
              "plannedIncome": "100000.00",
              "savingsTarget": "15000.00",
              "allocations": {"NEEDS": "40000.00", "WANTS": "20000.00", "CULTURE": "10000.00", "UNEXPECTED": "5000.00"}
            }
            """;

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private BudgetService budgetService;

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM monthly_budgets");
        jdbc.update("DELETE FROM transactions");
        jdbc.update("DELETE FROM categories WHERE user_id IS NOT NULL");
        jdbc.update("DELETE FROM app_users");
    }

    private static String plan(String income, String savings, String needs, String wants, String culture, String unexpected) {
        return """
                {"plannedIncome": %s, "savingsTarget": %s,
                 "allocations": {"NEEDS": %s, "WANTS": %s, "CULTURE": %s, "UNEXPECTED": %s}}
                """.formatted(q(income), q(savings), q(needs), q(wants), q(culture), q(unexpected));
    }

    private static String q(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }

    private UUID userId(String email) {
        return jdbc.queryForObject("SELECT id FROM app_users WHERE email = ?", UUID.class, email);
    }

    // --- Authentication and CSRF -------------------------------------------------

    @Test
    void unauthenticatedRequestsAreRejected() {
        var read = get(mvc, "/api/v1/budgets/2026-10", null);
        assertThat(read).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(read).bodyJson().extractingPath("$.code").isEqualTo("UNAUTHENTICATED");

        var write = put(mvc, "/api/v1/budgets/2026-10", REFERENCE_PLAN, null);
        assertThat(write).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM monthly_budgets", Integer.class)).isZero();
    }

    @Test
    void putRequiresAValidCsrfToken() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");

        var missing = com.divido.ApiSession.withSession(mvc.put().uri("/api/v1/budgets/2026-10"), session)
                .contentType(MediaType.APPLICATION_JSON).content(REFERENCE_PLAN).exchange();
        assertThat(missing).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(missing).bodyJson().extractingPath("$.code").isEqualTo("CSRF_INVALID");

        var tampered = com.divido.ApiSession.withSession(mvc.put().uri("/api/v1/budgets/2026-10"), session)
                .header("X-XSRF-TOKEN", "not-a-real-token")
                .contentType(MediaType.APPLICATION_JSON).content(REFERENCE_PLAN).exchange();
        assertThat(tampered).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM monthly_budgets", Integer.class)).isZero();
    }

    // --- Create, read, update ----------------------------------------------------

    @Test
    void missingBudgetReturnsBudgetNotFound() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        var result = get(mvc, "/api/v1/budgets/2026-10", session);
        assertThat(result).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("BUDGET_NOT_FOUND");
    }

    @Test
    void createsReadsAndStoresTheReferencePlan() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");

        var saved = put(mvc, "/api/v1/budgets/2026-10", REFERENCE_PLAN, session);
        assertThat(saved).hasStatus(HttpStatus.OK);
        assertThat(saved).bodyJson().extractingPath("$.month").isEqualTo("2026-10");
        assertThat(saved).bodyJson().extractingPath("$.plannedIncome").isEqualTo("100000.00");
        assertThat(saved).bodyJson().extractingPath("$.savingsTarget").isEqualTo("15000.00");
        assertThat(saved).bodyJson().extractingPath("$.allocations.NEEDS").isEqualTo("40000.00");
        assertThat(saved).bodyJson().extractingPath("$.allocations.WANTS").isEqualTo("20000.00");
        assertThat(saved).bodyJson().extractingPath("$.allocations.CULTURE").isEqualTo("10000.00");
        assertThat(saved).bodyJson().extractingPath("$.allocations.UNEXPECTED").isEqualTo("5000.00");
        assertThat(saved).bodyJson().extractingPath("$.allocationTotal").isEqualTo("75000.00");
        assertThat(saved).bodyJson().extractingPath("$.plannedTotal").isEqualTo("90000.00");
        assertThat(saved).bodyJson().extractingPath("$.overAllocationAmount").isEqualTo("-10000.00");
        assertThat(saved).bodyJson().extractingPath("$.overAllocated").isEqualTo(false);
        assertThat(saved).bodyJson().extractingPath("$.createdAt").isNotNull();

        var read = get(mvc, "/api/v1/budgets/2026-10", session);
        assertThat(read).hasStatus(HttpStatus.OK);
        assertThat(read).bodyJson().extractingPath("$.plannedTotal").isEqualTo("90000.00");

        // Database values, independent of the API
        Map<String, Object> row = jdbc.queryForMap("SELECT * FROM monthly_budgets WHERE user_id = ?",
                userId("alice@example.com"));
        assertThat(row.get("budget_month").toString()).isEqualTo("2026-10-01");
        assertThat((BigDecimal) row.get("planned_income")).isEqualByComparingTo("100000.00");
        assertThat((BigDecimal) row.get("savings_target")).isEqualByComparingTo("15000.00");
        assertThat((BigDecimal) row.get("needs_allocation")).isEqualByComparingTo("40000.00");
        assertThat((BigDecimal) row.get("wants_allocation")).isEqualByComparingTo("20000.00");
        assertThat((BigDecimal) row.get("culture_allocation")).isEqualByComparingTo("10000.00");
        assertThat((BigDecimal) row.get("unexpected_allocation")).isEqualByComparingTo("5000.00");
    }

    @Test
    void secondPutUpdatesTheSameRow() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        assertThat(put(mvc, "/api/v1/budgets/2026-10", REFERENCE_PLAN, session)).hasStatus(HttpStatus.OK);

        var updated = put(mvc, "/api/v1/budgets/2026-10",
                plan("120000.00", "20000", "50000.5", "20000", "10000", "5000"), session);
        assertThat(updated).hasStatus(HttpStatus.OK);
        assertThat(updated).bodyJson().extractingPath("$.plannedIncome").isEqualTo("120000.00");
        assertThat(updated).bodyJson().extractingPath("$.savingsTarget").isEqualTo("20000.00");
        assertThat(updated).bodyJson().extractingPath("$.allocations.NEEDS").isEqualTo("50000.50");
        assertThat(updated).bodyJson().extractingPath("$.allocationTotal").isEqualTo("85000.50");
        assertThat(updated).bodyJson().extractingPath("$.plannedTotal").isEqualTo("105000.50");
        assertThat(updated).bodyJson().extractingPath("$.overAllocationAmount").isEqualTo("-14999.50");

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM monthly_budgets", Integer.class)).isEqualTo(1);
    }

    @Test
    void monthsAreIndependent() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        assertThat(put(mvc, "/api/v1/budgets/2026-12", REFERENCE_PLAN, session)).hasStatus(HttpStatus.OK);
        assertThat(put(mvc, "/api/v1/budgets/2027-01", plan("1", "0", "0", "0", "0", "0"), session))
                .hasStatus(HttpStatus.OK);

        assertThat(get(mvc, "/api/v1/budgets/2026-12", session)).bodyJson()
                .extractingPath("$.plannedIncome").isEqualTo("100000.00");
        assertThat(get(mvc, "/api/v1/budgets/2027-01", session)).bodyJson()
                .extractingPath("$.plannedIncome").isEqualTo("1.00");
        assertThat(get(mvc, "/api/v1/budgets/2026-11", session)).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(jdbc.queryForList("SELECT budget_month::text FROM monthly_budgets ORDER BY budget_month", String.class))
                .containsExactly("2026-12-01", "2027-01-01");
    }

    @Test
    void overAllocatedPlanIsSavedWithWarningFigures() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        var saved = put(mvc, "/api/v1/budgets/2026-10",
                plan("80000.00", "15000.00", "40000.00", "20000.00", "10000.00", "5000.00"), session);
        assertThat(saved).hasStatus(HttpStatus.OK);
        assertThat(saved).bodyJson().extractingPath("$.plannedTotal").isEqualTo("90000.00");
        assertThat(saved).bodyJson().extractingPath("$.overAllocationAmount").isEqualTo("10000.00");
        assertThat(saved).bodyJson().extractingPath("$.overAllocated").isEqualTo(true);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM monthly_budgets", Integer.class)).isEqualTo(1);
    }

    @Test
    void zeroAndMaximumAmountsAreAccepted() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        var zero = put(mvc, "/api/v1/budgets/2026-10", plan("0", "0.00", "0", "0", "0", "0"), session);
        assertThat(zero).hasStatus(HttpStatus.OK);
        assertThat(zero).bodyJson().extractingPath("$.plannedIncome").isEqualTo("0.00");
        assertThat(zero).bodyJson().extractingPath("$.overAllocationAmount").isEqualTo("0.00");

        String max = "9999999999.99";
        var maxed = put(mvc, "/api/v1/budgets/2026-11", plan(max, max, max, max, max, max), session);
        assertThat(maxed).hasStatus(HttpStatus.OK);
        assertThat(maxed).bodyJson().extractingPath("$.allocationTotal").isEqualTo("39999999999.96");
        assertThat(maxed).bodyJson().extractingPath("$.plannedTotal").isEqualTo("49999999999.95");
        assertThat(maxed).bodyJson().extractingPath("$.overAllocationAmount").isEqualTo("39999999999.96");
    }

    // --- Validation --------------------------------------------------------------

    @ParameterizedTest
    @ValueSource(strings = {"2026-13", "2026-00", "2026-1", "26-10", "abc", "2026-10-01", "0000-01"})
    void invalidMonthIsRejected(String month) {
        MockHttpSession session = registerAndLogin(mvc, "alice+" + month.hashCode() + "@example.com");
        var read = get(mvc, "/api/v1/budgets/" + month, session);
        assertThat(read).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(read).bodyJson().extractingPath("$.fieldErrors.month").isNotNull();

        var write = put(mvc, "/api/v1/budgets/" + month, REFERENCE_PLAN, session);
        assertThat(write).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(write).bodyJson().extractingPath("$.fieldErrors.month").isNotNull();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM monthly_budgets", Integer.class)).isZero();
    }

    @Test
    void invalidAmountsAreRejectedPerField() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        var result = put(mvc, "/api/v1/budgets/2026-10",
                plan("-1.00", "12.345", "abc", "10000000000.00", "", null), session);
        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("VALIDATION_ERROR");
        assertThat(result).bodyJson().extractingPath("$.fieldErrors.plannedIncome").isEqualTo("Planned income cannot be negative.");
        assertThat(result).bodyJson().extractingPath("$.fieldErrors.savingsTarget")
                .isEqualTo("Savings target must be a number with at most 2 decimal places.");
        assertThat(result).bodyJson().extractingPath("$['fieldErrors']['allocations.NEEDS']")
                .isEqualTo("Needs allocation must be a number with at most 2 decimal places.");
        assertThat(result).bodyJson().extractingPath("$['fieldErrors']['allocations.WANTS']")
                .isEqualTo("Wants allocation exceeds the maximum allowed amount.");
        assertThat(result).bodyJson().extractingPath("$['fieldErrors']['allocations.CULTURE']")
                .isEqualTo("Culture allocation is required.");
        assertThat(result).bodyJson().extractingPath("$['fieldErrors']['allocations.UNEXPECTED']")
                .isEqualTo("Unexpected allocation is required.");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM monthly_budgets", Integer.class)).isZero();
    }

    @Test
    void missingFieldsAndGroupsAreRejectedNotDefaulted() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");

        var empty = put(mvc, "/api/v1/budgets/2026-10", "{}", session);
        assertThat(empty).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(empty).bodyJson().extractingPath("$.fieldErrors.plannedIncome").isEqualTo("Planned income is required.");
        assertThat(empty).bodyJson().extractingPath("$.fieldErrors.savingsTarget").isEqualTo("Savings target is required.");
        assertThat(empty).bodyJson().extractingPath("$.fieldErrors.allocations").isNotNull();

        var noBody = put(mvc, "/api/v1/budgets/2026-10", null, session);
        assertThat(noBody).hasStatus(HttpStatus.BAD_REQUEST);

        var partial = put(mvc, "/api/v1/budgets/2026-10",
                "{\"plannedIncome\":\"100\",\"savingsTarget\":\"0\",\"allocations\":{\"NEEDS\":\"10\"}}", session);
        assertThat(partial).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(partial).bodyJson().extractingPath("$['fieldErrors']['allocations.WANTS']").isEqualTo("Wants allocation is required.");

        var unknownGroup = put(mvc, "/api/v1/budgets/2026-10", """
                {"plannedIncome":"100","savingsTarget":"0",
                 "allocations":{"NEEDS":"1","WANTS":"1","CULTURE":"1","UNEXPECTED":"1","SAVINGS":"5"}}
                """, session);
        assertThat(unknownGroup).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(unknownGroup).bodyJson().extractingPath("$.fieldErrors.allocations")
                .isEqualTo("Allocations may only contain NEEDS, WANTS, CULTURE and UNEXPECTED.");

        var lowerCaseGroups = put(mvc, "/api/v1/budgets/2026-10", """
                {"plannedIncome":"100","savingsTarget":"0",
                 "allocations":{"needs":"1","wants":"1","culture":"1","unexpected":"1"}}
                """, session);
        assertThat(lowerCaseGroups).hasStatus(HttpStatus.BAD_REQUEST);

        var malformed = put(mvc, "/api/v1/budgets/2026-10", "{not json", session);
        assertThat(malformed).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(malformed).bodyJson().extractingPath("$.code").isEqualTo("MALFORMED_REQUEST");

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM monthly_budgets", Integer.class)).isZero();
    }

    @Test
    void databaseRejectsNegativeAmountsAndNonFirstDayMonths() {
        registerAndLogin(mvc, "alice@example.com");
        UUID alice = userId("alice@example.com");
        String insert = """
                INSERT INTO monthly_budgets (user_id, budget_month, planned_income, savings_target,
                  needs_allocation, wants_allocation, culture_allocation, unexpected_allocation)
                VALUES (?, ?::date, ?, 0, 0, 0, 0, 0)
                """;
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jdbc.update(insert, alice, "2026-10-01", new BigDecimal("-1")))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jdbc.update(insert, alice, "2026-10-15", BigDecimal.ONE))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        jdbc.update(insert, alice, "2026-10-01", BigDecimal.ONE);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jdbc.update(insert, alice, "2026-10-01", BigDecimal.TEN))
                .isInstanceOf(org.springframework.dao.DuplicateKeyException.class);
    }

    // --- Ownership isolation -----------------------------------------------------

    @Test
    void usersCannotReadOrOverwriteEachOthersBudgets() {
        MockHttpSession alice = registerAndLogin(mvc, "alice@example.com");
        MockHttpSession bob = registerAndLogin(mvc, "bob@example.com");
        assertThat(put(mvc, "/api/v1/budgets/2026-10", REFERENCE_PLAN, alice)).hasStatus(HttpStatus.OK);

        // Bob sees no plan for the same month
        var bobRead = get(mvc, "/api/v1/budgets/2026-10", bob);
        assertThat(bobRead).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(com.divido.ApiSession.body(bobRead)).doesNotContain("100000");

        // Bob's PUT, even naming Alice's id, creates Bob's own plan only
        UUID aliceId = userId("alice@example.com");
        var bobWrite = put(mvc, "/api/v1/budgets/2026-10", """
                {"userId": "%s", "plannedIncome": "1.00", "savingsTarget": "0",
                 "allocations": {"NEEDS": "0", "WANTS": "0", "CULTURE": "0", "UNEXPECTED": "0"}}
                """.formatted(aliceId), bob);
        assertThat(bobWrite).hasStatus(HttpStatus.OK);

        assertThat(get(mvc, "/api/v1/budgets/2026-10", alice)).bodyJson()
                .extractingPath("$.plannedIncome").isEqualTo("100000.00");
        assertThat(get(mvc, "/api/v1/budgets/2026-10", bob)).bodyJson()
                .extractingPath("$.plannedIncome").isEqualTo("1.00");
        assertThat(jdbc.queryForObject("SELECT planned_income FROM monthly_budgets WHERE user_id = ?",
                BigDecimal.class, aliceId)).isEqualByComparingTo("100000.00");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM monthly_budgets", Integer.class)).isEqualTo(2);
    }

    @Test
    void signedOutSessionCanNoLongerReadTheBudget() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        assertThat(put(mvc, "/api/v1/budgets/2026-10", REFERENCE_PLAN, session)).hasStatus(HttpStatus.OK);
        assertThat(com.divido.ApiSession.post(mvc, "/api/v1/auth/logout", null, session)).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(get(mvc, "/api/v1/budgets/2026-10", session)).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    // --- Concurrency -------------------------------------------------------------

    @Test
    void concurrentFirstSavesForTheSameMonthLeaveExactlyOneRow() throws Exception {
        registerAndLogin(mvc, "alice@example.com");
        UUID alice = userId("alice@example.com");
        int writers = 8;
        ExecutorService pool = Executors.newFixedThreadPool(writers);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<?>> futures = new ArrayList<>();
        try {
            for (int i = 0; i < writers; i++) {
                String income = (i + 1) + "000.00";
                futures.add(pool.submit(() -> {
                    start.await();
                    return budgetService.saveBudget(alice, "2026-10", new MonthlyBudgetRequest(income, "0",
                            Map.of("NEEDS", "0", "WANTS", "0", "CULTURE", "0", "UNEXPECTED", "0")));
                }));
            }
            start.countDown();
            for (Future<?> f : futures) {
                f.get(30, TimeUnit.SECONDS); // every writer succeeds: no duplicate-key failure
            }
        } finally {
            pool.shutdownNow();
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM monthly_budgets WHERE user_id = ? AND budget_month = ?",
                Integer.class, alice, LocalDate.of(2026, 10, 1))).isEqualTo(1);
        BigDecimal stored = jdbc.queryForObject("SELECT planned_income FROM monthly_budgets WHERE user_id = ?",
                BigDecimal.class, alice);
        // Last write wins: the stored value is one of the submitted values
        assertThat(stored.remainder(new BigDecimal("1000"))).isEqualByComparingTo("0");
        assertThat(stored).isBetween(new BigDecimal("1000"), new BigDecimal("8000"));
    }

    @Test
    void deletingTheUserCascadesToBudgets() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        assertThat(put(mvc, "/api/v1/budgets/2026-10", REFERENCE_PLAN, session)).hasStatus(HttpStatus.OK);
        jdbc.update("DELETE FROM app_users WHERE email = 'alice@example.com'");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM monthly_budgets", Integer.class)).isZero();
    }

    @Test
    void transactionEndpointsStillWorkAlongsideBudgets() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        assertThat(put(mvc, "/api/v1/budgets/2026-10", REFERENCE_PLAN, session)).hasStatus(HttpStatus.OK);
        var income = com.divido.ApiSession.post(mvc, "/api/v1/transactions",
                "{\"type\":\"INCOME\",\"amount\":\"10.00\",\"date\":\"2026-10-02\"}", session);
        assertThat(income).hasStatus(HttpStatus.CREATED);
        String id = com.jayway.jsonpath.JsonPath.read(com.divido.ApiSession.body(income), "$.id");
        assertThat(delete(mvc, "/api/v1/transactions/" + id, session)).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(get(mvc, "/api/v1/budgets/2026-10", session)).hasStatus(HttpStatus.OK);
    }
}
