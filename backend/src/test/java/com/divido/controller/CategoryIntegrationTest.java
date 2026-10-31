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
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class CategoryIntegrationTest {

    private static final String PASSWORD = "correct-horse-battery";

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @AfterEach
    void cleanUpUserData() {
        jdbc.update("DELETE FROM categories WHERE user_id IS NOT NULL");
        jdbc.update("DELETE FROM app_users");
    }

    @Test
    void flywaySeedsExactlyThreeGlobalDefaultCategories() {
        Integer globalCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM categories WHERE user_id IS NULL", Integer.class);
        assertThat(globalCount).isEqualTo(3);

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT name, slug, category_type, is_active FROM categories WHERE user_id IS NULL ORDER BY name ASC");

        assertThat(rows).hasSize(3);
        assertThat(rows.get(0).get("name")).isEqualTo("Entertainment");
        assertThat(rows.get(0).get("slug")).isEqualTo("entertainment");
        assertThat(rows.get(0).get("category_type")).isEqualTo("WANT");
        assertThat(rows.get(0).get("is_active")).isEqualTo(true);

        assertThat(rows.get(1).get("name")).isEqualTo("Groceries");
        assertThat(rows.get(1).get("slug")).isEqualTo("groceries");
        assertThat(rows.get(1).get("category_type")).isEqualTo("NEED");
        assertThat(rows.get(1).get("is_active")).isEqualTo(true);

        assertThat(rows.get(2).get("name")).isEqualTo("Transport");
        assertThat(rows.get(2).get("slug")).isEqualTo("transport");
        assertThat(rows.get(2).get("category_type")).isEqualTo("NEED");
        assertThat(rows.get(2).get("is_active")).isEqualTo(true);
    }

    @Test
    void unauthenticatedRequestIsRejected() {
        var result = mvc.get().uri("/api/v1/categories").exchange();
        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("UNAUTHENTICATED");
    }

    @Test
    void authenticatedUserRetrievesGlobalCategoriesWithGroupFilter() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        // List all usable categories
        var result = getWithSession("/api/v1/categories", session);
        assertThat(result).hasStatus(HttpStatus.OK);
        assertThat(result).bodyJson().extractingPath("$.items").asList().hasSize(3);

        // Filter by NEEDS (maps to NEED in database)
        var needsResult = getWithSession("/api/v1/categories?group=NEEDS", session);
        assertThat(needsResult).hasStatus(HttpStatus.OK);
        List<String> names = JsonPath.read(body(needsResult), "$.items[*].name");
        assertThat(names).containsExactlyInAnyOrder("Groceries", "Transport");

        // Filter by WANTS (maps to WANT in database)
        var wantsResult = getWithSession("/api/v1/categories?group=WANTS", session);
        assertThat(wantsResult).hasStatus(HttpStatus.OK);
        List<String> wantNames = JsonPath.read(body(wantsResult), "$.items[*].name");
        assertThat(wantNames).containsExactly("Entertainment");
    }

    @Test
    void userCanCreateCustomCategoryWithGeneratedSlug() {
        MockHttpSession session = registerAndLogin("bob@example.com");

        String payload = """
                {
                    "name": "Dining Out",
                    "group": "WANTS"
                }
                """;
        var createResult = postWithCsrf("/api/v1/categories", payload, session);
        assertThat(createResult).hasStatus(HttpStatus.CREATED);
        assertThat(createResult).bodyJson().extractingPath("$.name").isEqualTo("Dining Out");
        assertThat(createResult).bodyJson().extractingPath("$.group").isEqualTo("WANTS");
        assertThat(createResult).bodyJson().extractingPath("$.isDefault").isEqualTo(false);
        assertThat(createResult).bodyJson().extractingPath("$.active").isEqualTo(true);

        // Verify slug in database
        String categoryId = JsonPath.read(body(createResult), "$.id");
        String slug = jdbc.queryForObject(
                "SELECT slug FROM categories WHERE id = ?::uuid", String.class, categoryId);
        assertThat(slug).isEqualTo("dining-out");

        // When listing, user sees 3 defaults + their custom category
        var listResult = getWithSession("/api/v1/categories", session);
        assertThat(listResult).hasStatus(HttpStatus.OK);
        assertThat(listResult).bodyJson().extractingPath("$.items").asList().hasSize(4);
    }

    @Test
    void usersCannotAccessAnotherUsersCustomCategories() {
        MockHttpSession sessionAlice = registerAndLogin("alice@example.com");
        MockHttpSession sessionBob = registerAndLogin("bob@example.com");

        // Alice creates a custom category
        String payload = "{\"name\":\"Alice Personal\",\"group\":\"CULTURE\"}";
        var aliceCreate = postWithCsrf("/api/v1/categories", payload, sessionAlice);
        assertThat(aliceCreate).hasStatus(HttpStatus.CREATED);
        String aliceCatId = JsonPath.read(body(aliceCreate), "$.id");

        // Bob lists categories: should only see the 3 global defaults, NOT Alice's category
        var bobList = getWithSession("/api/v1/categories", sessionBob);
        assertThat(bobList).hasStatus(HttpStatus.OK);
        List<String> bobCategoryNames = JsonPath.read(body(bobList), "$.items[*].name");
        assertThat(bobCategoryNames).doesNotContain("Alice Personal");
        assertThat(bobCategoryNames).hasSize(3);

        // Bob tries to update Alice's category -> 404 (does not disclose existence)
        var bobUpdate = patchWithCsrf("/api/v1/categories/" + aliceCatId, "{\"name\":\"Hacked\"}", sessionBob);
        assertThat(bobUpdate).hasStatus(HttpStatus.NOT_FOUND);

        // Bob tries to deactivate Alice's category -> 404
        var bobDeactivate = postWithCsrf("/api/v1/categories/" + aliceCatId + "/deactivate", null, sessionBob);
        assertThat(bobDeactivate).hasStatus(HttpStatus.NOT_FOUND);
    }

    @Test
    void globalCategoriesCannotBeEditedOrDeactivated() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        // Find Groceries global category id
        String groceriesId = jdbc.queryForObject(
                "SELECT id::text FROM categories WHERE user_id IS NULL AND name = 'Groceries'", String.class);

        // Attempting to edit a global category -> 403 Forbidden
        var updateResult = patchWithCsrf("/api/v1/categories/" + groceriesId, "{\"name\":\"Changed\"}", session);
        assertThat(updateResult).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(updateResult).bodyJson().extractingPath("$.code").isEqualTo("FORBIDDEN");

        // Attempting to deactivate a global category -> 403 Forbidden
        var deactivateResult = postWithCsrf("/api/v1/categories/" + groceriesId + "/deactivate", null, session);
        assertThat(deactivateResult).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(deactivateResult).bodyJson().extractingPath("$.code").isEqualTo("FORBIDDEN");
    }

    @Test
    void duplicateCategoryNameIsRejectedWithConflict() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        // Attempting to create category with same name as global default -> 409 Conflict
        String payloadGroceries = "{\"name\":\"Groceries\",\"group\":\"NEEDS\"}";
        var conflictGlobal = postWithCsrf("/api/v1/categories", payloadGroceries, session);
        assertThat(conflictGlobal).hasStatus(HttpStatus.CONFLICT);
        assertThat(conflictGlobal).bodyJson().extractingPath("$.code").isEqualTo("CONFLICT");

        // Create custom category
        String payloadCustom = "{\"name\":\"Gym\",\"group\":\"NEEDS\"}";
        var created = postWithCsrf("/api/v1/categories", payloadCustom, session);
        assertThat(created).hasStatus(HttpStatus.CREATED);

        // Attempting to create duplicate custom category -> 409 Conflict
        var conflictCustom = postWithCsrf("/api/v1/categories", payloadCustom, session);
        assertThat(conflictCustom).hasStatus(HttpStatus.CONFLICT);
    }

    @Test
    void duplicateSlugIsHandledSafelyWithCounterSuffix() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        // Category 1: "Pet Care" -> slug "pet-care"
        var cat1 = postWithCsrf("/api/v1/categories", "{\"name\":\"Pet Care\",\"group\":\"NEEDS\"}", session);
        assertThat(cat1).hasStatus(HttpStatus.CREATED);
        String cat1Id = JsonPath.read(body(cat1), "$.id");
        String slug1 = jdbc.queryForObject("SELECT slug FROM categories WHERE id = ?::uuid", String.class, cat1Id);
        assertThat(slug1).isEqualTo("pet-care");

        // Category 2: "Pet-Care!" -> will slugify to "pet-care", but name is distinct
        var cat2 = postWithCsrf("/api/v1/categories", "{\"name\":\"Pet-Care!\",\"group\":\"NEEDS\"}", session);
        assertThat(cat2).hasStatus(HttpStatus.CREATED);
        String cat2Id = JsonPath.read(body(cat2), "$.id");
        String slug2 = jdbc.queryForObject("SELECT slug FROM categories WHERE id = ?::uuid", String.class, cat2Id);
        assertThat(slug2).isEqualTo("pet-care-2");
    }

    @Test
    void userCanUpdateAndDeactivateCustomCategory() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        var created = postWithCsrf("/api/v1/categories", "{\"name\":\"Old Name\",\"group\":\"NEEDS\"}", session);
        assertThat(created).hasStatus(HttpStatus.CREATED);
        String catId = JsonPath.read(body(created), "$.id");

        // Update name and group
        var updated = patchWithCsrf("/api/v1/categories/" + catId,
                "{\"name\":\"New Name\",\"group\":\"WANTS\"}", session);
        assertThat(updated).hasStatus(HttpStatus.OK);
        assertThat(updated).bodyJson().extractingPath("$.name").isEqualTo("New Name");
        assertThat(updated).bodyJson().extractingPath("$.group").isEqualTo("WANTS");

        // Deactivate
        var deactivated = postWithCsrf("/api/v1/categories/" + catId + "/deactivate", null, session);
        assertThat(deactivated).hasStatus(HttpStatus.NO_CONTENT);

        // Listing without includeInactive excludes the deactivated category
        var listActive = getWithSession("/api/v1/categories", session);
        List<String> activeNames = JsonPath.read(body(listActive), "$.items[*].name");
        assertThat(activeNames).doesNotContain("New Name");

        // Listing with includeInactive includes it
        var listAll = getWithSession("/api/v1/categories?includeInactive=true", session);
        List<String> allNames = JsonPath.read(body(listAll), "$.items[*].name");
        assertThat(allNames).contains("New Name");
    }

    @Test
    void validationErrorsReturnBadRequestWithFieldErrors() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        // Empty body
        var emptyResult = postWithCsrf("/api/v1/categories", "{}", session);
        assertThat(emptyResult).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(emptyResult).bodyJson().extractingPath("$.code").isEqualTo("VALIDATION_ERROR");

        // Blank name
        var blankResult = postWithCsrf("/api/v1/categories", "{\"name\":\"   \",\"group\":\"NEEDS\"}", session);
        assertThat(blankResult).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(blankResult).bodyJson().extractingPath("$.fieldErrors.name").isNotNull();
    }

    @Test
    void stateChangingRequestsRequireCsrf() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        // POST without CSRF header
        var request = mvc.post().uri("/api/v1/categories")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Test\",\"group\":\"NEEDS\"}");
        var result = request.exchange();
        assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("CSRF_INVALID");
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
