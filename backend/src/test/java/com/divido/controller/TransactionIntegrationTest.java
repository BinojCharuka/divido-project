package com.divido.controller;

import com.divido.CsrfSupport;
import com.divido.TestcontainersConfiguration;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class TransactionIntegrationTest {

    private static final String PASSWORD = "correct-horse-battery";

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @AfterEach
    void cleanUpUserData() {
        jdbc.update("DELETE FROM transactions");
        jdbc.update("DELETE FROM income_sources");
        jdbc.update("DELETE FROM categories WHERE user_id IS NOT NULL");
        jdbc.update("DELETE FROM app_users");
    }

    @Test
    void unauthenticatedRequestsAreRejected() {
        var getList = mvc.get().uri("/api/v1/transactions").exchange();
        assertThat(getList).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(getList).bodyJson().extractingPath("$.code").isEqualTo("UNAUTHENTICATED");

        var getOne = mvc.get().uri("/api/v1/transactions/" + UUID.randomUUID()).exchange();
        assertThat(getOne).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(getOne).bodyJson().extractingPath("$.code").isEqualTo("UNAUTHENTICATED");

        // Mutating requests with valid CSRF token but without authenticated session
        var post = postWithCsrf("/api/v1/transactions", "{}", null);
        assertThat(post).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(post).bodyJson().extractingPath("$.code").isEqualTo("UNAUTHENTICATED");

        var patch = patchWithCsrf("/api/v1/transactions/" + UUID.randomUUID(), "{}", null);
        assertThat(patch).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(patch).bodyJson().extractingPath("$.code").isEqualTo("UNAUTHENTICATED");

        var delete = deleteWithCsrf("/api/v1/transactions/" + UUID.randomUUID(), null);
        assertThat(delete).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(delete).bodyJson().extractingPath("$.code").isEqualTo("UNAUTHENTICATED");
    }

    @Test
    void mutatingRequestsRequireCsrf() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        var request = mvc.post().uri("/api/v1/transactions")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"EXPENSE\",\"amount\":\"100.00\",\"date\":\"2026-10-12\"}");
        var result = request.exchange();
        assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("CSRF_INVALID");
    }

    @Test
    void userCanCreateAndRetrieveExpenseWithGlobalCategory() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        UUID groceriesId = jdbc.queryForObject(
                "SELECT id FROM categories WHERE slug = 'groceries' AND user_id IS NULL", UUID.class);

        String createJson = """
                {
                    "type": "EXPENSE",
                    "amount": "2400.00",
                    "date": "2026-10-12",
                    "categoryId": "%s",
                    "description": "Weekly groceries",
                    "paymentMethod": "CASH"
                }
                """.formatted(groceriesId);

        var createResult = postWithCsrf("/api/v1/transactions", createJson, session);
        assertThat(createResult).hasStatus(HttpStatus.CREATED);
        assertThat(createResult).bodyJson().extractingPath("$.type").isEqualTo("EXPENSE");
        assertThat(createResult).bodyJson().extractingPath("$.amount").isEqualTo("2400.00");
        assertThat(createResult).bodyJson().extractingPath("$.date").isEqualTo("2026-10-12");
        assertThat(createResult).bodyJson().extractingPath("$.category.id").isEqualTo(groceriesId.toString());
        assertThat(createResult).bodyJson().extractingPath("$.category.name").isEqualTo("Groceries");
        assertThat(createResult).bodyJson().extractingPath("$.category.group").isEqualTo("NEEDS");
        assertThat(createResult).bodyJson().extractingPath("$.incomeSource").isNull();
        assertThat(createResult).bodyJson().extractingPath("$.description").isEqualTo("Weekly groceries");
        assertThat(createResult).bodyJson().extractingPath("$.paymentMethod").isEqualTo("CASH");
        assertThat(createResult).bodyJson().extractingPath("$.createdAt").isNotNull();
        assertThat(createResult).bodyJson().extractingPath("$.updatedAt").isNotNull();

        String txId = JsonPath.read(body(createResult), "$.id");

        var getResult = getWithSession("/api/v1/transactions/" + txId, session);
        assertThat(getResult).hasStatus(HttpStatus.OK);
        assertThat(getResult).bodyJson().extractingPath("$.id").isEqualTo(txId);
        assertThat(getResult).bodyJson().extractingPath("$.amount").isEqualTo("2400.00");
    }

    @Test
    void userCanCreateExpenseWithOwnCustomCategory() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        var catResult = postWithCsrf("/api/v1/categories",
                "{\"name\":\"Gym Membership\",\"group\":\"NEEDS\"}", session);
        assertThat(catResult).hasStatus(HttpStatus.CREATED);
        String customCatId = JsonPath.read(body(catResult), "$.id");

        String createJson = """
                {
                    "type": "EXPENSE",
                    "amount": "5000.00",
                    "date": "2026-10-01",
                    "categoryId": "%s",
                    "description": "Monthly gym fee"
                }
                """.formatted(customCatId);

        var result = postWithCsrf("/api/v1/transactions", createJson, session);
        assertThat(result).hasStatus(HttpStatus.CREATED);
        assertThat(result).bodyJson().extractingPath("$.category.name").isEqualTo("Gym Membership");
    }

    @Test
    void userCanCreateIncomeWithAndWithoutIncomeSource() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        // 1. Income with income source
        var srcResult = postWithCsrf("/api/v1/income-sources",
                "{\"name\":\"Software Job\"}", session);
        assertThat(srcResult).hasStatus(HttpStatus.CREATED);
        String srcId = JsonPath.read(body(srcResult), "$.id");

        String withSrcJson = """
                {
                    "type": "INCOME",
                    "amount": "85000.00",
                    "date": "2026-10-01",
                    "incomeSourceId": "%s",
                    "description": "October salary"
                }
                """.formatted(srcId);

        var r1 = postWithCsrf("/api/v1/transactions", withSrcJson, session);
        assertThat(r1).hasStatus(HttpStatus.CREATED);
        assertThat(r1).bodyJson().extractingPath("$.type").isEqualTo("INCOME");
        assertThat(r1).bodyJson().extractingPath("$.amount").isEqualTo("85000.00");
        assertThat(r1).bodyJson().extractingPath("$.category").isNull();
        assertThat(r1).bodyJson().extractingPath("$.incomeSource.id").isEqualTo(srcId);
        assertThat(r1).bodyJson().extractingPath("$.incomeSource.name").isEqualTo("Software Job");

        // 2. Income without income source (DEC-003)
        String withoutSrcJson = """
                {
                    "type": "INCOME",
                    "amount": "5000.00",
                    "date": "2026-10-05",
                    "description": "Cash gift"
                }
                """;
        var r2 = postWithCsrf("/api/v1/transactions", withoutSrcJson, session);
        assertThat(r2).hasStatus(HttpStatus.CREATED);
        assertThat(r2).bodyJson().extractingPath("$.incomeSource").isNull();
    }

    @Test
    void listTransactionsWithPaginationAndFilters() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        UUID groceriesId = jdbc.queryForObject(
                "SELECT id FROM categories WHERE slug = 'groceries' AND user_id IS NULL", UUID.class);

        var srcResult = postWithCsrf("/api/v1/income-sources", "{\"name\":\"Salary\"}", session);
        String srcId = JsonPath.read(body(srcResult), "$.id");

        // Create 3 transactions: 2 expenses and 1 income on distinct dates
        postWithCsrf("/api/v1/transactions", """
                {"type":"EXPENSE","amount":"1000.00","date":"2026-10-01","categoryId":"%s"}
                """.formatted(groceriesId), session);

        postWithCsrf("/api/v1/transactions", """
                {"type":"EXPENSE","amount":"2000.00","date":"2026-10-10","categoryId":"%s"}
                """.formatted(groceriesId), session);

        postWithCsrf("/api/v1/transactions", """
                {"type":"INCOME","amount":"50000.00","date":"2026-10-15","incomeSourceId":"%s"}
                """.formatted(srcId), session);

        // List page 0, size 2 -> items size 2, totalItems 3, totalPages 2
        var paged = getWithSession("/api/v1/transactions?page=0&size=2", session);
        assertThat(paged).hasStatus(HttpStatus.OK);
        assertThat(paged).bodyJson().extractingPath("$.items").asList().hasSize(2);
        assertThat(paged).bodyJson().extractingPath("$.totalItems").isEqualTo(3);
        assertThat(paged).bodyJson().extractingPath("$.totalPages").isEqualTo(2);

        // Sorted by date desc: first should be 2026-10-15
        assertThat(paged).bodyJson().extractingPath("$.items[0].date").isEqualTo("2026-10-15");
        assertThat(paged).bodyJson().extractingPath("$.items[1].date").isEqualTo("2026-10-10");

        // Filter by type=EXPENSE
        var expenseOnly = getWithSession("/api/v1/transactions?type=EXPENSE", session);
        assertThat(expenseOnly).hasStatus(HttpStatus.OK);
        assertThat(expenseOnly).bodyJson().extractingPath("$.totalItems").isEqualTo(2);

        // Filter by date range (from=2026-10-05&to=2026-10-12)
        var dateFiltered = getWithSession("/api/v1/transactions?from=2026-10-05&to=2026-10-12", session);
        assertThat(dateFiltered).hasStatus(HttpStatus.OK);
        assertThat(dateFiltered).bodyJson().extractingPath("$.totalItems").isEqualTo(1);
        assertThat(dateFiltered).bodyJson().extractingPath("$.items[0].date").isEqualTo("2026-10-10");

        // Filter by categoryId
        var catFiltered = getWithSession("/api/v1/transactions?categoryId=" + groceriesId, session);
        assertThat(catFiltered).hasStatus(HttpStatus.OK);
        assertThat(catFiltered).bodyJson().extractingPath("$.totalItems").isEqualTo(2);

        // Filter by incomeSourceId
        var srcFiltered = getWithSession("/api/v1/transactions?incomeSourceId=" + srcId, session);
        assertThat(srcFiltered).hasStatus(HttpStatus.OK);
        assertThat(srcFiltered).bodyJson().extractingPath("$.totalItems").isEqualTo(1);
    }

    @Test
    void patchSemanticsPreserveOmittedFieldsAndClearExplicitNulls() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        UUID groceriesId = jdbc.queryForObject(
                "SELECT id FROM categories WHERE slug = 'groceries' AND user_id IS NULL", UUID.class);
        UUID transportId = jdbc.queryForObject(
                "SELECT id FROM categories WHERE slug = 'transport' AND user_id IS NULL", UUID.class);

        // Create transaction with full details
        var createResult = postWithCsrf("/api/v1/transactions", """
                {
                    "type": "EXPENSE",
                    "amount": "1500.00",
                    "date": "2026-10-02",
                    "categoryId": "%s",
                    "description": "Weekly bus card",
                    "paymentMethod": "CARD"
                }
                """.formatted(transportId), session);
        String txId = JsonPath.read(body(createResult), "$.id");

        // 1. Partial update: change only amount. Description and payment method must NOT be cleared.
        var patch1 = patchWithCsrf("/api/v1/transactions/" + txId, "{\"amount\":\"1800.00\"}", session);
        assertThat(patch1).hasStatus(HttpStatus.OK);
        assertThat(patch1).bodyJson().extractingPath("$.amount").isEqualTo("1800.00");
        assertThat(patch1).bodyJson().extractingPath("$.description").isEqualTo("Weekly bus card");
        assertThat(patch1).bodyJson().extractingPath("$.paymentMethod").isEqualTo("CARD");
        assertThat(patch1).bodyJson().extractingPath("$.category.id").isEqualTo(transportId.toString());

        // 2. Partial update: explicitly clear description with null, change category
        var patch2 = patchWithCsrf("/api/v1/transactions/" + txId, """
                {
                    "description": null,
                    "categoryId": "%s"
                }
                """.formatted(groceriesId), session);
        assertThat(patch2).hasStatus(HttpStatus.OK);
        assertThat(patch2).bodyJson().extractingPath("$.description").isNull();
        assertThat(patch2).bodyJson().extractingPath("$.paymentMethod").isEqualTo("CARD");
        assertThat(patch2).bodyJson().extractingPath("$.category.id").isEqualTo(groceriesId.toString());
    }

    @Test
    void patchIncomeSourceOnIncomeTransactionCanUpdateOrClear() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        var src1 = postWithCsrf("/api/v1/income-sources", "{\"name\":\"Freelance\"}", session);
        String srcId1 = JsonPath.read(body(src1), "$.id");

        var src2 = postWithCsrf("/api/v1/income-sources", "{\"name\":\"Investments\"}", session);
        String srcId2 = JsonPath.read(body(src2), "$.id");

        // Create income with source 1
        var createResult = postWithCsrf("/api/v1/transactions", """
                {"type":"INCOME","amount":"10000.00","date":"2026-10-01","incomeSourceId":"%s"}
                """.formatted(srcId1), session);
        String txId = JsonPath.read(body(createResult), "$.id");
        assertThat(createResult).bodyJson().extractingPath("$.incomeSource.id").isEqualTo(srcId1);

        // Update to source 2
        var patch1 = patchWithCsrf("/api/v1/transactions/" + txId, """
                {"incomeSourceId":"%s"}
                """.formatted(srcId2), session);
        assertThat(patch1).hasStatus(HttpStatus.OK);
        assertThat(patch1).bodyJson().extractingPath("$.incomeSource.id").isEqualTo(srcId2);

        // Explicitly clear source (DEC-003)
        var patch2 = patchWithCsrf("/api/v1/transactions/" + txId, "{\"incomeSourceId\":null}", session);
        assertThat(patch2).hasStatus(HttpStatus.OK);
        assertThat(patch2).bodyJson().extractingPath("$.incomeSource").isNull();
    }

    @Test
    void hardDeleteRemovesTransactionPermanently() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        UUID groceriesId = jdbc.queryForObject(
                "SELECT id FROM categories WHERE slug = 'groceries' AND user_id IS NULL", UUID.class);

        var createResult = postWithCsrf("/api/v1/transactions", """
                {"type":"EXPENSE","amount":"500.00","date":"2026-10-05","categoryId":"%s"}
                """.formatted(groceriesId), session);
        String txId = JsonPath.read(body(createResult), "$.id");

        // Delete returns 204
        var delResult = deleteWithCsrf("/api/v1/transactions/" + txId, session);
        assertThat(delResult).hasStatus(HttpStatus.NO_CONTENT);

        // Subsequent GET returns 404
        var getResult = getWithSession("/api/v1/transactions/" + txId, session);
        assertThat(getResult).hasStatus(HttpStatus.NOT_FOUND);

        // Database row is physically deleted (DEC-014)
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM transactions WHERE id = ?", Integer.class, UUID.fromString(txId));
        assertThat(count).isEqualTo(0);
    }

    @Test
    void crossUserIsolationEnforcedOnAllOperations() {
        MockHttpSession aliceSession = registerAndLogin("alice@example.com");
        MockHttpSession bobSession = registerAndLogin("bob@example.com");

        UUID groceriesId = jdbc.queryForObject(
                "SELECT id FROM categories WHERE slug = 'groceries' AND user_id IS NULL", UUID.class);

        // Alice creates transaction
        var aliceTx = postWithCsrf("/api/v1/transactions", """
                {"type":"EXPENSE","amount":"350.00","date":"2026-10-10","categoryId":"%s"}
                """.formatted(groceriesId), aliceSession);
        String aliceTxId = JsonPath.read(body(aliceTx), "$.id");

        // Bob cannot read Alice's transaction -> 404
        var bobGet = getWithSession("/api/v1/transactions/" + aliceTxId, bobSession);
        assertThat(bobGet).hasStatus(HttpStatus.NOT_FOUND);

        // Bob cannot update Alice's transaction -> 404
        var bobPatch = patchWithCsrf("/api/v1/transactions/" + aliceTxId, "{\"amount\":\"999.00\"}", bobSession);
        assertThat(bobPatch).hasStatus(HttpStatus.NOT_FOUND);

        // Bob cannot delete Alice's transaction -> 404
        var bobDelete = deleteWithCsrf("/api/v1/transactions/" + aliceTxId, bobSession);
        assertThat(bobDelete).hasStatus(HttpStatus.NOT_FOUND);

        // Bob's transaction list does NOT contain Alice's transaction
        var bobList = getWithSession("/api/v1/transactions", bobSession);
        assertThat(bobList).hasStatus(HttpStatus.OK);
        assertThat(bobList).bodyJson().extractingPath("$.totalItems").isEqualTo(0);
    }

    @Test
    void crossUserCategoryAndIncomeSourceIsolationEnforced() {
        MockHttpSession aliceSession = registerAndLogin("alice@example.com");
        MockHttpSession bobSession = registerAndLogin("bob@example.com");

        // Alice creates custom category and income source
        var catResult = postWithCsrf("/api/v1/categories", "{\"name\":\"Alice Only\",\"group\":\"WANTS\"}", aliceSession);
        String aliceCatId = JsonPath.read(body(catResult), "$.id");

        var srcResult = postWithCsrf("/api/v1/income-sources", "{\"name\":\"Alice Job\"}", aliceSession);
        String aliceSrcId = JsonPath.read(body(srcResult), "$.id");

        // Bob tries to create expense with Alice's custom category -> 400 validation error
        var bobExpense = postWithCsrf("/api/v1/transactions", """
                {"type":"EXPENSE","amount":"100.00","date":"2026-10-10","categoryId":"%s"}
                """.formatted(aliceCatId), bobSession);
        assertThat(bobExpense).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(bobExpense).bodyJson().extractingPath("$.code").isEqualTo("VALIDATION_ERROR");
        assertThat(bobExpense).bodyJson().extractingPath("$.fieldErrors.categoryId").isNotNull();

        // Bob tries to create income with Alice's income source -> 400 validation error
        var bobIncome = postWithCsrf("/api/v1/transactions", """
                {"type":"INCOME","amount":"500.00","date":"2026-10-10","incomeSourceId":"%s"}
                """.formatted(aliceSrcId), bobSession);
        assertThat(bobIncome).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(bobIncome).bodyJson().extractingPath("$.code").isEqualTo("VALIDATION_ERROR");
        assertThat(bobIncome).bodyJson().extractingPath("$.fieldErrors.incomeSourceId").isNotNull();
    }

    @Test
    void invalidTypeCrossReferencesAreRejected() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        UUID groceriesId = jdbc.queryForObject(
                "SELECT id FROM categories WHERE slug = 'groceries' AND user_id IS NULL", UUID.class);

        var srcResult = postWithCsrf("/api/v1/income-sources", "{\"name\":\"Bonus\"}", session);
        String srcId = JsonPath.read(body(srcResult), "$.id");

        // 1. Expense with incomeSourceId -> rejected
        var expWithSrc = postWithCsrf("/api/v1/transactions", """
                {
                    "type": "EXPENSE",
                    "amount": "100.00",
                    "date": "2026-10-10",
                    "categoryId": "%s",
                    "incomeSourceId": "%s"
                }
                """.formatted(groceriesId, srcId), session);
        assertThat(expWithSrc).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(expWithSrc).bodyJson().extractingPath("$.fieldErrors.incomeSourceId").isNotNull();

        // 2. Expense without categoryId -> rejected
        var expNoCat = postWithCsrf("/api/v1/transactions", """
                {"type":"EXPENSE","amount":"100.00","date":"2026-10-10"}
                """, session);
        assertThat(expNoCat).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(expNoCat).bodyJson().extractingPath("$.fieldErrors.categoryId").isNotNull();

        // 3. Income with categoryId -> rejected
        var incWithCat = postWithCsrf("/api/v1/transactions", """
                {"type":"INCOME","amount":"100.00","date":"2026-10-10","categoryId":"%s"}
                """.formatted(groceriesId), session);
        assertThat(incWithCat).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(incWithCat).bodyJson().extractingPath("$.fieldErrors.categoryId").isNotNull();
    }

    @Test
    void inactiveCategoryOrIncomeSourceIsRejected() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        // Create and deactivate category
        var catResult = postWithCsrf("/api/v1/categories", "{\"name\":\"Old Hobby\",\"group\":\"WANTS\"}", session);
        String catId = JsonPath.read(body(catResult), "$.id");
        postWithCsrf("/api/v1/categories/" + catId + "/deactivate", null, session);

        // Expense referencing inactive category -> rejected
        var expResult = postWithCsrf("/api/v1/transactions", """
                {"type":"EXPENSE","amount":"50.00","date":"2026-10-10","categoryId":"%s"}
                """.formatted(catId), session);
        assertThat(expResult).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(expResult).bodyJson().extractingPath("$.fieldErrors.categoryId").isEqualTo("Category is inactive.");

        // Create and deactivate income source
        var srcResult = postWithCsrf("/api/v1/income-sources", "{\"name\":\"Old Job\"}", session);
        String srcId = JsonPath.read(body(srcResult), "$.id");
        postWithCsrf("/api/v1/income-sources/" + srcId + "/deactivate", null, session);

        // Income referencing inactive source -> rejected
        var incResult = postWithCsrf("/api/v1/transactions", """
                {"type":"INCOME","amount":"500.00","date":"2026-10-10","incomeSourceId":"%s"}
                """.formatted(srcId), session);
        assertThat(incResult).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(incResult).bodyJson().extractingPath("$.fieldErrors.incomeSourceId").isEqualTo("Income source is inactive.");
    }

    @Test
    void moneySafetyAndValidationRules() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        UUID groceriesId = jdbc.queryForObject(
                "SELECT id FROM categories WHERE slug = 'groceries' AND user_id IS NULL", UUID.class);

        // 1. Negative amount
        var neg = postWithCsrf("/api/v1/transactions", """
                {"type":"EXPENSE","amount":"-25.00","date":"2026-10-10","categoryId":"%s"}
                """.formatted(groceriesId), session);
        assertThat(neg).hasStatus(HttpStatus.BAD_REQUEST);

        // 2. Zero amount
        var zero = postWithCsrf("/api/v1/transactions", """
                {"type":"EXPENSE","amount":"0.00","date":"2026-10-10","categoryId":"%s"}
                """.formatted(groceriesId), session);
        assertThat(zero).hasStatus(HttpStatus.BAD_REQUEST);

        // 3. More than 2 decimal places
        var precision = postWithCsrf("/api/v1/transactions", """
                {"type":"EXPENSE","amount":"10.555","date":"2026-10-10","categoryId":"%s"}
                """.formatted(groceriesId), session);
        assertThat(precision).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(precision).bodyJson().extractingPath("$.fieldErrors.amount").isNotNull();

        // 4. Invalid date range (from after to)
        var invalidRange = getWithSession("/api/v1/transactions?from=2026-10-20&to=2026-10-10", session);
        assertThat(invalidRange).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(invalidRange).bodyJson().extractingPath("$.fieldErrors.from").isNotNull();

        // 5. Invalid page index
        var invalidPage = getWithSession("/api/v1/transactions?page=-1", session);
        assertThat(invalidPage).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(invalidPage).bodyJson().extractingPath("$.fieldErrors.page").isNotNull();
    }

    // Helper methods
    private MockHttpSession registerAndLogin(String email) {
        var reg = postWithCsrf("/api/v1/auth/register",
                "{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\",\"displayName\":\"User\"}", null);
        assertThat(reg).hasStatus(HttpStatus.CREATED);

        var loginResult = postWithCsrf("/api/v1/auth/login",
                "{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}", null);
        assertThat(loginResult).hasStatus(HttpStatus.OK);
        return (MockHttpSession) loginResult.getRequest().getSession(false);
    }

    private MvcTestResult postWithCsrf(String uri, String json, MockHttpSession session) {
        var request = CsrfSupport.fetch(mvc).apply(mvc.post().uri(uri));
        if (session != null) {
            request.session(session).with(r -> {
                r.setRequestedSessionId(session.getId());
                r.setRequestedSessionIdValid(true);
                return r;
            });
        }
        if (json != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(json);
        }
        return request.exchange();
    }

    private MvcTestResult patchWithCsrf(String uri, String json, MockHttpSession session) {
        var request = CsrfSupport.fetch(mvc).apply(mvc.patch().uri(uri));
        if (session != null) {
            request.session(session).with(r -> {
                r.setRequestedSessionId(session.getId());
                r.setRequestedSessionIdValid(true);
                return r;
            });
        }
        if (json != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(json);
        }
        return request.exchange();
    }

    private MvcTestResult deleteWithCsrf(String uri, MockHttpSession session) {
        var request = CsrfSupport.fetch(mvc).apply(mvc.delete().uri(uri));
        if (session != null) {
            request.session(session).with(r -> {
                r.setRequestedSessionId(session.getId());
                r.setRequestedSessionIdValid(true);
                return r;
            });
        }
        return request.exchange();
    }

    private MvcTestResult getWithSession(String uri, MockHttpSession session) {
        var request = mvc.get().uri(uri);
        if (session != null) {
            request.session(session).with(r -> {
                r.setRequestedSessionId(session.getId());
                r.setRequestedSessionIdValid(true);
                return r;
            });
        }
        return request.exchange();
    }

    private static String body(MvcTestResult result) {
        return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
    }
}
