package com.divido.controller;

import com.divido.Phase04FixedClock;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.divido.ApiSession.body;
import static com.divido.ApiSession.delete;
import static com.divido.ApiSession.get;
import static com.divido.ApiSession.post;
import static com.divido.ApiSession.put;
import static com.divido.ApiSession.registerAndLogin;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * DIV-027: INSIGHT-001 rules (DEC-031, DEC-032, DEC-033, DEC-041) with fixed
 * synthetic data. "Today" is 16 November 2026 in Asia/Colombo
 * ({@link Phase04FixedClock}). Expected figures are written out by hand.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, Phase04FixedClock.class})
class InsightsIntegrationTest {

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM monthly_budgets");
        jdbc.update("DELETE FROM transactions");
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

    private void income(MockHttpSession session, String amount, String date) {
        var result = post(mvc, "/api/v1/transactions",
                "{\"type\":\"INCOME\",\"amount\":\"" + amount + "\",\"date\":\"" + date + "\"}", session);
        assertThat(result).hasStatus(HttpStatus.CREATED);
    }

    private MvcTestResult insights(MockHttpSession session, String month) {
        var result = get(mvc, "/api/v1/insights" + (month == null ? "" : "?month=" + month), session);
        assertThat(result).hasStatus(HttpStatus.OK);
        return result;
    }

    private static <T> T path(MvcTestResult result, String jsonPath) {
        return JsonPath.read(body(result), jsonPath);
    }

    private static List<Map<String, Object>> observations(MvcTestResult result, String type) {
        return JsonPath.read(body(result), "$.observations[?(@.type == '" + type + "')]");
    }

    private static Object group(MvcTestResult result, String group, String field) {
        List<Object> values = JsonPath.read(body(result), "$.groups[?(@.group == '" + group + "')]." + field);
        return values.get(0);
    }

    // --- Security and month handling ---------------------------------------------

    @Test
    void unauthenticatedRequestIsRejected() {
        var result = get(mvc, "/api/v1/insights?month=2026-10", null);
        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("UNAUTHENTICATED");
    }

    @Test
    void invalidAndFutureMonthsAreRejected() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        for (String month : new String[]{"2026-13", "2026-1", "x", "2026-10-01", "2026-12"}) {
            var result = get(mvc, "/api/v1/insights?month=" + month, session);
            assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
            assertThat(result).bodyJson().extractingPath("$.fieldErrors.month").isNotNull();
        }
    }

    @Test
    void omittedMonthIsTheCurrentColomboMonthUpToToday() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        var result = insights(session, null);
        assertThat(path(result, "$.month").toString()).isEqualTo("2026-11");
        assertThat(path(result, "$.periodEnd").toString()).isEqualTo("2026-11-30");
        assertThat(path(result, "$.asOf").toString()).isEqualTo("2026-11-16");
        assertThat((Boolean) path(result, "$.partialMonth")).isTrue();
        assertThat(path(result, "$.lookbackStart").toString()).isEqualTo("2026-08-19");
        assertThat(path(result, "$.lookbackEnd").toString()).isEqualTo("2026-11-16");
    }

    // --- Empty and insufficient history --------------------------------------------

    @Test
    void emptyHistoryIsInsufficientAndFabricatesNothing() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        var result = insights(session, "2026-10");
        assertThat(path(result, "$.asOf").toString()).isEqualTo("2026-10-31");
        assertThat((Boolean) path(result, "$.partialMonth")).isFalse();
        assertThat(path(result, "$.lookbackStart").toString()).isEqualTo("2026-08-03");
        assertThat((Integer) path(result, "$.minimumSpendingDays")).isEqualTo(3);
        assertThat((Integer) path(result, "$.spendingDays")).isZero();
        assertThat((Boolean) path(result, "$.insufficientHistory")).isTrue();
        assertThat(path(result, "$.totalSpent").toString()).isEqualTo("0.00");
        assertThat(group(result, "NEEDS", "sharePercent")).isNull();
        assertThat((Object) path(result, "$.comparison.changePercent")).isNull();
        assertThat(JsonPath.<List<?>>read(body(result), "$.observations")).isEmpty();
        assertThat(JsonPath.<List<String>>read(body(result), "$.trend[*].month"))
                .containsExactly("2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10");
        assertThat(JsonPath.<List<Boolean>>read(body(result), "$.trend[*].hasActivity")).containsOnly(false);
        assertThat(JsonPath.<List<Object>>read(body(result), "$.trend[*].totalSpent")).containsOnlyNulls();
    }

    @Test
    void incomeNeverCountsAsSpending() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        income(session, "1000.00", "2026-10-01");
        income(session, "1000.00", "2026-10-02");
        income(session, "1000.00", "2026-10-03");
        var result = insights(session, "2026-10");
        assertThat((Integer) path(result, "$.spendingDays")).isZero();
        assertThat(path(result, "$.totalSpent").toString()).isEqualTo("0.00");
        assertThat(JsonPath.<List<?>>read(body(result), "$.observations")).isEmpty();
    }

    // --- LARGEST_GROUP -----------------------------------------------------------------

    @Test
    void largestGroupAppearsOnlyFromThreeDistinctSpendingDays() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        expense(session, "1000.00", "2026-10-01", globalCategory("groceries"));
        expense(session, "500.00", "2026-10-01", globalCategory("groceries")); // same day counts once
        expense(session, "300.00", "2026-10-02", globalCategory("entertainment"));

        var two = insights(session, "2026-10");
        assertThat((Integer) path(two, "$.spendingDays")).isEqualTo(2);
        assertThat((Boolean) path(two, "$.insufficientHistory")).isTrue();
        assertThat(observations(two, "LARGEST_GROUP")).isEmpty();

        expense(session, "200.00", "2026-10-03", globalCategory("transport"));
        var three = insights(session, "2026-10");
        assertThat((Integer) path(three, "$.spendingDays")).isEqualTo(3);
        assertThat((Boolean) path(three, "$.insufficientHistory")).isFalse();
        assertThat(path(three, "$.totalSpent").toString()).isEqualTo("2000.00");
        assertThat(group(three, "NEEDS", "spent")).isEqualTo("1700.00");
        assertThat(group(three, "NEEDS", "sharePercent")).isEqualTo("85.0");
        assertThat(group(three, "WANTS", "sharePercent")).isEqualTo("15.0");
        assertThat(group(three, "CULTURE", "sharePercent")).isEqualTo("0.0");
        assertThat(group(three, "NEEDS", "expenseCount")).isEqualTo(3);

        List<Map<String, Object>> largest = observations(three, "LARGEST_GROUP");
        assertThat(largest).hasSize(1);
        assertThat(largest.get(0)).containsEntry("group", "NEEDS").containsEntry("spent", "1700.00")
                .containsEntry("sharePercent", "85.0").containsEntry("spendingDays", 3);

        // Same figures as the dashboard for the same month.
        var dashboard = get(mvc, "/api/v1/dashboard?month=2026-10", session);
        assertThat(JsonPath.<String>read(body(dashboard), "$.totalSpent")).isEqualTo("2000.00");
        assertThat(JsonPath.<List<String>>read(body(dashboard), "$.groups[?(@.group == 'NEEDS')].spent"))
                .containsExactly("1700.00");
    }

    @Test
    void aTieForLargestGroupNamesNoGroup() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        expense(session, "50.00", "2026-10-01", globalCategory("groceries"));
        expense(session, "100.00", "2026-10-02", globalCategory("entertainment"));
        expense(session, "50.00", "2026-10-03", globalCategory("groceries"));
        var result = insights(session, "2026-10");
        assertThat((Boolean) path(result, "$.insufficientHistory")).isFalse();
        assertThat(observations(result, "LARGEST_GROUP")).isEmpty();
    }

    // --- GROUP_OVER_PLAN ---------------------------------------------------------------

    @Test
    void groupOverPlanNeedsAPlanAPositiveBudgetAndSpendingAboveIt() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        String culture = createCategory(session, "Books", "CULTURE");
        expense(session, "1500.00", "2026-10-05", globalCategory("groceries"));
        expense(session, "300.00", "2026-10-05", globalCategory("entertainment"));
        expense(session, "50.00", "2026-10-05", culture);

        assertThat(observations(insights(session, "2026-10"), "GROUP_OVER_PLAN")).isEmpty(); // no plan

        assertThat(put(mvc, "/api/v1/budgets/2026-10", """
                {"plannedIncome": "5000.00", "savingsTarget": "0.00",
                 "allocations": {"NEEDS": "1000.00", "WANTS": "300.00", "CULTURE": "0.00", "UNEXPECTED": "100.00"}}
                """, session)).hasStatus(HttpStatus.OK);
        List<Map<String, Object>> over = observations(insights(session, "2026-10"), "GROUP_OVER_PLAN");
        // NEEDS over by 500; WANTS exactly at plan; CULTURE has a zero budget; UNEXPECTED unspent.
        assertThat(over).hasSize(1);
        assertThat(over.get(0)).containsEntry("group", "NEEDS").containsEntry("budget", "1000.00")
                .containsEntry("spent", "1500.00").containsEntry("overBy", "500.00");
    }

    // --- MONTH_CHANGE and the comparison ---------------------------------------------

    @Test
    void currentMonthComparesTheSameDayRangeOfThePreviousMonth() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        UUID groceries = globalCategory("groceries");
        expense(session, "100.00", "2026-10-02", groceries);
        expense(session, "100.00", "2026-10-05", groceries);
        String oct9 = expense(session, "100.00", "2026-10-09", groceries);
        expense(session, "1000.00", "2026-10-20", groceries); // after day 16: outside the comparison
        expense(session, "150.00", "2026-11-01", groceries);
        expense(session, "150.00", "2026-11-03", groceries);
        expense(session, "150.00", "2026-11-10", groceries);
        expense(session, "500.00", "2026-11-20", groceries); // future-dated: in the month, not in the comparison

        var result = insights(session, "2026-11");
        assertThat(path(result, "$.totalSpent").toString()).isEqualTo("950.00");
        assertThat(path(result, "$.comparison.currentStart").toString()).isEqualTo("2026-11-01");
        assertThat(path(result, "$.comparison.currentEnd").toString()).isEqualTo("2026-11-16");
        assertThat(path(result, "$.comparison.previousStart").toString()).isEqualTo("2026-10-01");
        assertThat(path(result, "$.comparison.previousEnd").toString()).isEqualTo("2026-10-16");
        assertThat(path(result, "$.comparison.currentSpent").toString()).isEqualTo("450.00");
        assertThat(path(result, "$.comparison.previousSpent").toString()).isEqualTo("300.00");
        assertThat(path(result, "$.comparison.changePercent").toString()).isEqualTo("50.0");
        assertThat(JsonPath.<List<String>>read(body(result), "$.comparison.groups[?(@.group == 'NEEDS')].changePercent"))
                .containsExactly("50.0");
        assertThat(JsonPath.<List<Object>>read(body(result), "$.comparison.groups[?(@.group == 'WANTS')].changePercent"))
                .containsOnlyNulls();
        List<Map<String, Object>> change = observations(result, "MONTH_CHANGE");
        assertThat(change).hasSize(1);
        assertThat(change.get(0)).containsEntry("currentSpent", "450.00").containsEntry("previousSpent", "300.00")
                .containsEntry("changePercent", "50.0");

        // Hard-deleting one October expense leaves 2 spending days in that range: no observation.
        assertThat(delete(mvc, "/api/v1/transactions/" + oct9, session)).hasStatus(HttpStatus.NO_CONTENT);
        var after = insights(session, "2026-11");
        assertThat(path(after, "$.comparison.previousSpent").toString()).isEqualTo("200.00");
        assertThat((Integer) path(after, "$.comparison.previousSpendingDays")).isEqualTo(2);
        assertThat(observations(after, "MONTH_CHANGE")).isEmpty();
    }

    @Test
    void completeMonthComparesWithTheWholePreviousMonth() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        UUID groceries = globalCategory("groceries");
        expense(session, "100.00", "2026-09-30", groceries);
        expense(session, "100.00", "2026-10-31", groceries);
        var result = insights(session, "2026-10");
        assertThat(path(result, "$.comparison.currentEnd").toString()).isEqualTo("2026-10-31");
        assertThat(path(result, "$.comparison.previousEnd").toString()).isEqualTo("2026-09-30");
        assertThat(path(result, "$.comparison.previousSpent").toString()).isEqualTo("100.00");
        assertThat(path(result, "$.comparison.changePercent").toString()).isEqualTo("0.0");
    }

    // --- REPEATED_CATEGORY and the lookback ---------------------------------------------

    @Test
    void repeatedCategoryCountsDistinctDaysInsideTheNinetyDayLookback() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        UUID groceries = globalCategory("groceries");
        UUID transport = globalCategory("transport");
        expense(session, "10.00", "2026-08-18", groceries); // day 91: outside
        expense(session, "10.00", "2026-08-19", groceries); // day 1 of 90: inside
        expense(session, "10.00", "2026-09-10", groceries);
        expense(session, "10.00", "2026-09-10", groceries);
        expense(session, "10.00", "2026-11-16", groceries); // today: inside
        expense(session, "10.00", "2026-11-17", groceries); // after asOf: outside
        expense(session, "10.00", "2026-10-01", transport);
        expense(session, "10.00", "2026-10-01", transport);
        expense(session, "10.00", "2026-10-02", transport); // two days only

        List<Map<String, Object>> repeated = observations(insights(session, "2026-11"), "REPEATED_CATEGORY");
        assertThat(repeated).hasSize(1);
        assertThat(repeated.get(0))
                .containsEntry("categoryId", groceries.toString())
                .containsEntry("categoryName", "Groceries")
                .containsEntry("group", "NEEDS")
                .containsEntry("distinctDays", 3)
                .containsEntry("transactionCount", 4)
                .containsEntry("dates", List.of("2026-08-19", "2026-09-10", "2026-11-16"));
        assertThat(repeated.get(0)).doesNotContainKey("label");
    }

    @Test
    void repeatedCategoriesAreOrderedByDaysThenCount() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        UUID groceries = globalCategory("groceries");
        UUID transport = globalCategory("transport");
        for (String day : new String[]{"2026-10-01", "2026-10-02", "2026-10-03"}) {
            expense(session, "10.00", day, groceries);
        }
        for (String day : new String[]{"2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"}) {
            expense(session, "10.00", day, transport);
        }
        var result = insights(session, "2026-10");
        assertThat(JsonPath.<List<String>>read(body(result), "$.observations[?(@.type == 'REPEATED_CATEGORY')].categoryName"))
                .containsExactly("Transport", "Groceries");
    }

    // --- Trend ---------------------------------------------------------------------------

    @Test
    void trendShowsNoActivityBeforeTheFirstTransactionAndRealZerosAfter() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        income(session, "5000.00", "2026-08-05");
        expense(session, "200.00", "2026-09-10", globalCategory("groceries"));
        expense(session, "75.50", "2026-11-02", globalCategory("groceries"));

        var result = insights(session, "2026-11");
        assertThat(JsonPath.<List<String>>read(body(result), "$.trend[*].month"))
                .containsExactly("2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11");
        assertThat(JsonPath.<List<Boolean>>read(body(result), "$.trend[*].hasActivity"))
                .containsExactly(false, false, true, true, true, true);
        assertThat(JsonPath.<List<Object>>read(body(result), "$.trend[*].totalSpent"))
                .containsExactly(null, null, "0.00", "200.00", "0.00", "75.50");
        assertThat(JsonPath.<List<Boolean>>read(body(result), "$.trend[*].partial"))
                .containsExactly(false, false, false, false, false, true);
    }

    // --- Isolation -------------------------------------------------------------------------

    @Test
    void anotherUsersRecordsNeverAffectInsights() {
        MockHttpSession bob = registerAndLogin(mvc, "bob@example.com");
        String secret = createCategory(bob, "Bob private", "WANTS");
        for (String day : new String[]{"2026-10-01", "2026-10-02", "2026-10-03"}) {
            expense(bob, "999.00", day, secret);
        }
        assertThat(put(mvc, "/api/v1/budgets/2026-10", """
                {"plannedIncome": "1.00", "savingsTarget": "0.00",
                 "allocations": {"NEEDS": "1.00", "WANTS": "1.00", "CULTURE": "1.00", "UNEXPECTED": "1.00"}}
                """, bob)).hasStatus(HttpStatus.OK);

        MockHttpSession alice = registerAndLogin(mvc, "alice@example.com");
        expense(alice, "10.00", "2026-10-01", globalCategory("groceries"));
        var result = insights(alice, "2026-10");
        assertThat(path(result, "$.totalSpent").toString()).isEqualTo("10.00");
        assertThat((Integer) path(result, "$.spendingDays")).isEqualTo(1);
        assertThat(JsonPath.<List<?>>read(body(result), "$.observations")).isEmpty();
        assertThat(body(result)).doesNotContain("Bob private").doesNotContain("999");
    }
}
