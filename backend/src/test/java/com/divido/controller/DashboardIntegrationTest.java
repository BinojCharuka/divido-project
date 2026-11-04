package com.divido.controller;

import com.divido.ApiSession;
import com.divido.TestcontainersConfiguration;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.math.BigDecimal;
import java.util.UUID;

import static com.divido.ApiSession.body;
import static com.divido.ApiSession.delete;
import static com.divido.ApiSession.get;
import static com.divido.ApiSession.post;
import static com.divido.ApiSession.put;
import static com.divido.ApiSession.registerAndLogin;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * DIV-026: DASH-001 aggregation and reconciliation. Every expected figure is written
 * out by hand from the fixture, never computed by production code, and is checked
 * against both the API and the database.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class DashboardIntegrationTest {

    private static final String REFERENCE_PLAN = """
            {"plannedIncome": "100000.00", "savingsTarget": "15000.00",
             "allocations": {"NEEDS": "40000.00", "WANTS": "20000.00", "CULTURE": "10000.00", "UNEXPECTED": "5000.00"}}
            """;

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM monthly_budgets");
        jdbc.update("DELETE FROM transactions");
        jdbc.update("DELETE FROM income_sources");
        jdbc.update("DELETE FROM categories WHERE user_id IS NOT NULL");
        jdbc.update("DELETE FROM app_users");
    }

    private UUID globalCategory(String slug) {
        return jdbc.queryForObject("SELECT id FROM categories WHERE slug = ? AND user_id IS NULL", UUID.class, slug);
    }

    private String createCategory(MockHttpSession session, String name, String group) {
        var result = post(mvc, "/api/v1/categories", "{\"name\":\"" + name + "\",\"group\":\"" + group + "\"}", session);
        assertThat(result).hasStatus(HttpStatus.CREATED);
        return JsonPath.read(body(result), "$.id");
    }

    private String expense(MockHttpSession session, String amount, String date, Object categoryId) {
        var result = post(mvc, "/api/v1/transactions", """
                {"type":"EXPENSE","amount":"%s","date":"%s","categoryId":"%s"}
                """.formatted(amount, date, categoryId), session);
        assertThat(result).hasStatus(HttpStatus.CREATED);
        return JsonPath.read(body(result), "$.id");
    }

    private String income(MockHttpSession session, String amount, String date) {
        var result = post(mvc, "/api/v1/transactions",
                "{\"type\":\"INCOME\",\"amount\":\"" + amount + "\",\"date\":\"" + date + "\"}", session);
        assertThat(result).hasStatus(HttpStatus.CREATED);
        return JsonPath.read(body(result), "$.id");
    }

    private static Object path(MvcTestResult result, String jsonPath) {
        return JsonPath.read(body(result), jsonPath);
    }

    private static Object group(MvcTestResult result, String group, String field) {
        return JsonPath.read(body(result), "$.groups[?(@.group == '" + group + "')]." + field + "");
    }

    // --- Security ----------------------------------------------------------------

    @Test
    void unauthenticatedRequestIsRejected() {
        var result = get(mvc, "/api/v1/dashboard?month=2026-10", null);
        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("UNAUTHENTICATED");
    }

    @Test
    void invalidMonthIsRejected() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        for (String month : new String[]{"2026-13", "2026-1", "x", "2026-10-01"}) {
            var result = get(mvc, "/api/v1/dashboard?month=" + month, session);
            assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
            assertThat(result).bodyJson().extractingPath("$.fieldErrors.month").isNotNull();
        }
    }

    // --- Empty states ------------------------------------------------------------

    @Test
    void completelyEmptyMonthHasExplicitMissingPlanAndRealZeroActuals() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        var result = get(mvc, "/api/v1/dashboard?month=2026-10", session);
        assertThat(result).hasStatus(HttpStatus.OK);
        assertThat(result).bodyJson().extractingPath("$.month").isEqualTo("2026-10");
        assertThat(result).bodyJson().extractingPath("$.periodStart").isEqualTo("2026-10-01");
        assertThat(result).bodyJson().extractingPath("$.periodEnd").isEqualTo("2026-10-31");
        assertThat(result).bodyJson().extractingPath("$.hasBudget").isEqualTo(false);
        for (String planned : new String[]{"plannedIncome", "savingsTarget", "allocationTotal", "plannedTotal",
                "overAllocationAmount", "overAllocated"}) {
            assertThat(result).bodyJson().extractingPath("$." + planned).isNull();
        }
        assertThat(result).bodyJson().extractingPath("$.recordedIncome").isEqualTo("0.00");
        assertThat(result).bodyJson().extractingPath("$.incomeTransactionCount").isEqualTo(0);
        assertThat(result).bodyJson().extractingPath("$.totalSpent").isEqualTo("0.00");
        assertThat(result).bodyJson().extractingPath("$.expenseTransactionCount").isEqualTo(0);
        assertThat(result).bodyJson().extractingPath("$.groups[*].group")
                .asArray().containsExactly("NEEDS", "WANTS", "CULTURE", "UNEXPECTED");
        assertThat(result).bodyJson().extractingPath("$.groups[0].budget").isNull();
        assertThat(result).bodyJson().extractingPath("$.groups[0].spent").isEqualTo("0.00");
        assertThat(result).bodyJson().extractingPath("$.groups[0].remaining").isNull();
        assertThat(result).bodyJson().extractingPath("$.groups[0].percentUsed").isNull();
        assertThat(result).bodyJson().extractingPath("$.groups[0].overBudget").isNull();
        assertThat(body(result)).doesNotContain("insightPreview").doesNotContain("recentTransactions");
    }

    @Test
    void budgetWithoutTransactions() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        assertThat(put(mvc, "/api/v1/budgets/2026-10", REFERENCE_PLAN, session)).hasStatus(HttpStatus.OK);
        var result = get(mvc, "/api/v1/dashboard?month=2026-10", session);
        assertThat(result).bodyJson().extractingPath("$.hasBudget").isEqualTo(true);
        assertThat(result).bodyJson().extractingPath("$.plannedIncome").isEqualTo("100000.00");
        assertThat(result).bodyJson().extractingPath("$.recordedIncome").isEqualTo("0.00");
        assertThat(result).bodyJson().extractingPath("$.totalSpent").isEqualTo("0.00");
        assertThat(group(result, "NEEDS", "remaining")).asString().contains("40000.00");
        assertThat(group(result, "NEEDS", "percentUsed")).asString().contains("0.0");
        assertThat(group(result, "NEEDS", "overBudget")).asString().contains("false");
    }

    @Test
    void transactionsWithoutBudgetStillShowRealActuals() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        expense(session, "1200.00", "2026-10-05", globalCategory("groceries"));
        income(session, "50000.00", "2026-10-01");
        var result = get(mvc, "/api/v1/dashboard?month=2026-10", session);
        assertThat(result).bodyJson().extractingPath("$.hasBudget").isEqualTo(false);
        assertThat(result).bodyJson().extractingPath("$.plannedIncome").isNull();
        assertThat(result).bodyJson().extractingPath("$.recordedIncome").isEqualTo("50000.00");
        assertThat(result).bodyJson().extractingPath("$.totalSpent").isEqualTo("1200.00");
        assertThat(result).bodyJson().extractingPath("$.groups[0].spent").isEqualTo("1200.00");
        assertThat(result).bodyJson().extractingPath("$.groups[0].budget").isNull();
        assertThat(result).bodyJson().extractingPath("$.groups[0].remaining").isNull();
    }

    // --- Reconciliation ----------------------------------------------------------

    /**
     * Fixture A (reference plan, within budget).
     * NEEDS:      Groceries 12,500.25 + 8,000.00, Transport 1,499.75   = 22,000.00 -> remaining 18,000.00, 55.0%
     * WANTS:      Entertainment 4,500.10 + 4,499.90                     =  9,000.00 -> remaining 11,000.00, 45.0%
     * CULTURE:    custom "Books" 3,000.00                               =  3,000.00 -> remaining  7,000.00, 30.0%
     * UNEXPECTED: custom "Repairs" 1,000.00                             =  1,000.00 -> remaining  4,000.00, 20.0%
     * Total spent 35,000.00 across 7 expenses. Income 60,000.00 + 25,000.00 = 85,000.00 (2 entries).
     * Outside the month (ignored): 2026-09-30 expense 999.99, 2026-11-01 income 777.77.
     */
    @Test
    void referenceFixtureReconcilesAcrossDatabaseAndApi() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        assertThat(put(mvc, "/api/v1/budgets/2026-10", REFERENCE_PLAN, session)).hasStatus(HttpStatus.OK);
        String books = createCategory(session, "Books", "CULTURE");
        String repairs = createCategory(session, "Repairs", "UNEXPECTED");

        expense(session, "12500.25", "2026-10-01", globalCategory("groceries"));
        expense(session, "8000.00", "2026-10-31", globalCategory("groceries"));
        expense(session, "1499.75", "2026-10-15", globalCategory("transport"));
        expense(session, "4500.10", "2026-10-10", globalCategory("entertainment"));
        expense(session, "4499.90", "2026-10-11", globalCategory("entertainment"));
        expense(session, "3000.00", "2026-10-20", books);
        expense(session, "1000.00", "2026-10-21", repairs);
        income(session, "60000.00", "2026-10-01");
        income(session, "25000.00", "2026-10-31");
        expense(session, "999.99", "2026-09-30", globalCategory("groceries"));
        income(session, "777.77", "2026-11-01");

        var result = get(mvc, "/api/v1/dashboard?month=2026-10", session);
        assertThat(result).hasStatus(HttpStatus.OK);
        assertThat(result).bodyJson().extractingPath("$.plannedIncome").isEqualTo("100000.00");
        assertThat(result).bodyJson().extractingPath("$.savingsTarget").isEqualTo("15000.00");
        assertThat(result).bodyJson().extractingPath("$.allocationTotal").isEqualTo("75000.00");
        assertThat(result).bodyJson().extractingPath("$.plannedTotal").isEqualTo("90000.00");
        assertThat(result).bodyJson().extractingPath("$.overAllocationAmount").isEqualTo("-10000.00");
        assertThat(result).bodyJson().extractingPath("$.overAllocated").isEqualTo(false);
        assertThat(result).bodyJson().extractingPath("$.recordedIncome").isEqualTo("85000.00");
        assertThat(result).bodyJson().extractingPath("$.incomeTransactionCount").isEqualTo(2);
        assertThat(result).bodyJson().extractingPath("$.totalSpent").isEqualTo("35000.00");
        assertThat(result).bodyJson().extractingPath("$.expenseTransactionCount").isEqualTo(7);

        assertGroup(result, 0, "NEEDS", "40000.00", "22000.00", "18000.00", "55.0", false, 3);
        assertGroup(result, 1, "WANTS", "20000.00", "9000.00", "11000.00", "45.0", false, 2);
        assertGroup(result, 2, "CULTURE", "10000.00", "3000.00", "7000.00", "30.0", false, 1);
        assertGroup(result, 3, "UNEXPECTED", "5000.00", "1000.00", "4000.00", "20.0", false, 1);

        // Database cross-check computed by SQL independent of the JPA aggregate
        BigDecimal dbNeeds = jdbc.queryForObject("""
                SELECT SUM(t.amount) FROM transactions t JOIN categories c ON c.id = t.category_id
                WHERE t.type = 'EXPENSE' AND c.category_type = 'NEED'
                  AND t.transaction_date BETWEEN '2026-10-01' AND '2026-10-31'
                """, BigDecimal.class);
        assertThat(dbNeeds).isEqualByComparingTo("22000.00");
        BigDecimal dbIncome = jdbc.queryForObject("""
                SELECT SUM(amount) FROM transactions WHERE type = 'INCOME'
                  AND transaction_date BETWEEN '2026-10-01' AND '2026-10-31'
                """, BigDecimal.class);
        assertThat(dbIncome).isEqualByComparingTo("85000.00");

        // Budget API and Dashboard API agree on the plan figures
        var budget = get(mvc, "/api/v1/budgets/2026-10", session);
        for (String field : new String[]{"plannedIncome", "savingsTarget", "allocationTotal", "plannedTotal",
                "overAllocationAmount"}) {
            assertThat(path(budget, "$." + field)).isEqualTo(path(result, "$." + field));
        }
    }

    @Test
    void expensesOnTheLastDayOfAMonthStayInThatMonth() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        expense(session, "8000.00", "2026-10-31", globalCategory("groceries"));
        expense(session, "10.00", "2026-11-01", globalCategory("groceries"));
        assertThat(get(mvc, "/api/v1/dashboard?month=2026-10", session)).bodyJson()
                .extractingPath("$.totalSpent").isEqualTo("8000.00");
        assertThat(get(mvc, "/api/v1/dashboard?month=2026-11", session)).bodyJson()
                .extractingPath("$.totalSpent").isEqualTo("10.00");
    }

    /**
     * Fixture B (over-allocated plan, overspent groups).
     * Plan: income 80,000.00, savings 15,000.00, allocations 40,000/20,000/10,000/5,000 -> planned 90,000.00,
     * over-allocation +10,000.00.
     * Spending: NEEDS 41,250.50 (40,000.00 + 1,250.50) -> remaining -1,250.50, 103.1%
     *           UNEXPECTED 6,250.00 -> remaining -1,250.00, 125.0%
     */
    @Test
    void overAllocatedAndOverspentFixture() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        assertThat(put(mvc, "/api/v1/budgets/2026-10", """
                {"plannedIncome": "80000.00", "savingsTarget": "15000.00",
                 "allocations": {"NEEDS": "40000.00", "WANTS": "20000.00", "CULTURE": "10000.00", "UNEXPECTED": "5000.00"}}
                """, session)).hasStatus(HttpStatus.OK);
        String repairs = createCategory(session, "Repairs", "UNEXPECTED");
        expense(session, "40000.00", "2026-10-03", globalCategory("groceries"));
        expense(session, "1250.50", "2026-10-04", globalCategory("transport"));
        expense(session, "6250.00", "2026-10-05", repairs);

        var result = get(mvc, "/api/v1/dashboard?month=2026-10", session);
        assertThat(result).bodyJson().extractingPath("$.overAllocationAmount").isEqualTo("10000.00");
        assertThat(result).bodyJson().extractingPath("$.overAllocated").isEqualTo(true);
        assertThat(result).bodyJson().extractingPath("$.totalSpent").isEqualTo("47500.50");
        assertGroup(result, 0, "NEEDS", "40000.00", "41250.50", "-1250.50", "103.1", true, 2);
        assertGroup(result, 1, "WANTS", "20000.00", "0.00", "20000.00", "0.0", false, 0);
        assertGroup(result, 3, "UNEXPECTED", "5000.00", "6250.00", "-1250.00", "125.0", true, 1);
    }

    @Test
    void zeroAllocationHasNoPercentageButStillShowsOverspending() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        assertThat(put(mvc, "/api/v1/budgets/2026-10", """
                {"plannedIncome": "1000", "savingsTarget": "0",
                 "allocations": {"NEEDS": "1000", "WANTS": "0", "CULTURE": "0", "UNEXPECTED": "0"}}
                """, session)).hasStatus(HttpStatus.OK);
        expense(session, "300.00", "2026-10-09", globalCategory("entertainment"));
        var result = get(mvc, "/api/v1/dashboard?month=2026-10", session);
        assertGroup(result, 1, "WANTS", "0.00", "300.00", "-300.00", null, true, 1);
        assertGroup(result, 2, "CULTURE", "0.00", "0.00", "0.00", null, false, 0);
    }

    // --- Month boundaries --------------------------------------------------------

    @Test
    void decemberToJanuaryAndLeapFebruaryBoundaries() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        UUID groceries = globalCategory("groceries");
        expense(session, "1.00", "2026-12-01", groceries);
        expense(session, "2.00", "2026-12-31", groceries);
        expense(session, "4.00", "2027-01-01", groceries);
        expense(session, "8.00", "2028-02-28", groceries);
        expense(session, "16.00", "2028-02-29", groceries);
        expense(session, "32.00", "2028-03-01", groceries);
        expense(session, "64.00", "2027-02-28", groceries);
        expense(session, "128.00", "2027-03-01", groceries);

        var december = get(mvc, "/api/v1/dashboard?month=2026-12", session);
        assertThat(december).bodyJson().extractingPath("$.totalSpent").isEqualTo("3.00");
        assertThat(december).bodyJson().extractingPath("$.periodEnd").isEqualTo("2026-12-31");
        assertThat(get(mvc, "/api/v1/dashboard?month=2027-01", session)).bodyJson()
                .extractingPath("$.totalSpent").isEqualTo("4.00");

        var leapFeb = get(mvc, "/api/v1/dashboard?month=2028-02", session);
        assertThat(leapFeb).bodyJson().extractingPath("$.totalSpent").isEqualTo("24.00");
        assertThat(leapFeb).bodyJson().extractingPath("$.periodEnd").isEqualTo("2028-02-29");
        var plainFeb = get(mvc, "/api/v1/dashboard?month=2027-02", session);
        assertThat(plainFeb).bodyJson().extractingPath("$.totalSpent").isEqualTo("64.00");
        assertThat(plainFeb).bodyJson().extractingPath("$.periodEnd").isEqualTo("2027-02-28");
        assertThat(get(mvc, "/api/v1/dashboard?month=2028-03", session)).bodyJson()
                .extractingPath("$.totalSpent").isEqualTo("32.00");
    }

    // --- Lifecycle ---------------------------------------------------------------

    @Test
    void hardDeletedAndEditedTransactionsAreReflectedImmediately() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        String keep = expense(session, "100.00", "2026-10-05", globalCategory("groceries"));
        String gone = expense(session, "250.00", "2026-10-06", globalCategory("groceries"));
        assertThat(get(mvc, "/api/v1/dashboard?month=2026-10", session)).bodyJson()
                .extractingPath("$.totalSpent").isEqualTo("350.00");

        assertThat(delete(mvc, "/api/v1/transactions/" + gone, session)).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(get(mvc, "/api/v1/dashboard?month=2026-10", session)).bodyJson()
                .extractingPath("$.totalSpent").isEqualTo("100.00");

        // Moving the remaining expense to another month removes it from October
        assertThat(ApiSession.write(mvc, mvc.patch().uri("/api/v1/transactions/" + keep),
                "{\"date\":\"2026-11-02\"}", session)).hasStatus(HttpStatus.OK);
        assertThat(get(mvc, "/api/v1/dashboard?month=2026-10", session)).bodyJson()
                .extractingPath("$.totalSpent").isEqualTo("0.00");
        assertThat(get(mvc, "/api/v1/dashboard?month=2026-11", session)).bodyJson()
                .extractingPath("$.totalSpent").isEqualTo("100.00");
    }

    @Test
    void inactiveCategoryExpensesStillCount() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        String books = createCategory(session, "Books", "CULTURE");
        expense(session, "500.00", "2026-10-05", books);
        assertThat(ApiSession.write(mvc, mvc.post().uri("/api/v1/categories/" + books + "/deactivate"), null, session))
                .hasStatus(HttpStatus.NO_CONTENT);
        var result = get(mvc, "/api/v1/dashboard?month=2026-10", session);
        assertThat(result).bodyJson().extractingPath("$.groups[2].spent").isEqualTo("500.00");
    }

    // --- Ownership isolation -----------------------------------------------------

    @Test
    void dashboardsAreIsolatedBetweenUsers() {
        MockHttpSession alice = registerAndLogin(mvc, "alice@example.com");
        MockHttpSession bob = registerAndLogin(mvc, "bob@example.com");
        assertThat(put(mvc, "/api/v1/budgets/2026-10", REFERENCE_PLAN, alice)).hasStatus(HttpStatus.OK);
        expense(alice, "1234.56", "2026-10-05", globalCategory("groceries"));
        income(alice, "99999.00", "2026-10-01");

        expense(bob, "10.00", "2026-10-05", globalCategory("groceries"));

        var bobView = get(mvc, "/api/v1/dashboard?month=2026-10", bob);
        assertThat(bobView).bodyJson().extractingPath("$.hasBudget").isEqualTo(false);
        assertThat(bobView).bodyJson().extractingPath("$.recordedIncome").isEqualTo("0.00");
        assertThat(bobView).bodyJson().extractingPath("$.totalSpent").isEqualTo("10.00");
        assertThat(body(bobView)).doesNotContain("1234.56").doesNotContain("99999").doesNotContain("100000");

        var aliceView = get(mvc, "/api/v1/dashboard?month=2026-10", alice);
        assertThat(aliceView).bodyJson().extractingPath("$.totalSpent").isEqualTo("1234.56");
        assertThat(aliceView).bodyJson().extractingPath("$.recordedIncome").isEqualTo("99999.00");

        // A userId query parameter is not an ownership input
        UUID aliceId = jdbc.queryForObject("SELECT id FROM app_users WHERE email = 'alice@example.com'", UUID.class);
        var spoofed = get(mvc, "/api/v1/dashboard?month=2026-10&userId=" + aliceId, bob);
        assertThat(spoofed).bodyJson().extractingPath("$.totalSpent").isEqualTo("10.00");
    }

    private static void assertGroup(MvcTestResult result, int index, String group, String budget, String spent,
                                    String remaining, String percent, boolean overBudget, int count) {
        String base = "$.groups[" + index + "].";
        assertThat(result).bodyJson().extractingPath(base + "group").isEqualTo(group);
        assertThat(result).bodyJson().extractingPath(base + "budget").isEqualTo(budget);
        assertThat(result).bodyJson().extractingPath(base + "spent").isEqualTo(spent);
        assertThat(result).bodyJson().extractingPath(base + "remaining").isEqualTo(remaining);
        if (percent == null) {
            assertThat(result).bodyJson().extractingPath(base + "percentUsed").isNull();
        } else {
            assertThat(result).bodyJson().extractingPath(base + "percentUsed").isEqualTo(percent);
        }
        assertThat(result).bodyJson().extractingPath(base + "overBudget").isEqualTo(overBudget);
        assertThat(result).bodyJson().extractingPath(base + "expenseCount").isEqualTo(count);
    }
}
