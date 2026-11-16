package com.divido.controller;

import com.divido.Phase04FixedClock;
import com.divido.TestcontainersConfiguration;
import com.divido.dto.ReflectionAnswerDto;
import com.divido.dto.ReflectionRequest;
import com.divido.exception.ReflectionConflictException;
import com.divido.service.ReflectionService;
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

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static com.divido.ApiSession.body;
import static com.divido.ApiSession.delete;
import static com.divido.ApiSession.get;
import static com.divido.ApiSession.put;
import static com.divido.ApiSession.registerAndLogin;
import static com.divido.ApiSession.withSession;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * DIV-028: REFLECTION-001..004 against disposable PostgreSQL with Flyway V1-V6.
 * "Today" is 16 November 2026 in Asia/Colombo ({@link Phase04FixedClock}).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, Phase04FixedClock.class})
class ReflectionIntegrationTest {

    private static final String WELL = """
            {"answers": [{"questionId": "what-went-well", "answer": "Planned groceries before the week."}]}
            """;

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private ReflectionService reflectionService;

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM reflections");
        jdbc.update("DELETE FROM app_users");
    }

    private UUID userId(String email) {
        return jdbc.queryForObject("SELECT id FROM app_users WHERE email = ?", UUID.class, email);
    }

    private static String edit(int version, String questionId, String answer) {
        return """
                {"version": %d, "answers": [{"questionId": "%s", "answer": "%s"}]}
                """.formatted(version, questionId, answer);
    }

    // --- Security ----------------------------------------------------------------

    @Test
    void everyRouteRequiresAuthentication() {
        assertThat(get(mvc, "/api/v1/reflections", null)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(get(mvc, "/api/v1/reflections/2026-10", null)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(put(mvc, "/api/v1/reflections/2026-10", WELL, null)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(delete(mvc, "/api/v1/reflections/2026-10", null)).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void writesRequireAValidCsrfToken() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        var missing = withSession(mvc.put().uri("/api/v1/reflections/2026-10"), session)
                .contentType(MediaType.APPLICATION_JSON).content(WELL).exchange();
        assertThat(missing).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(missing).bodyJson().extractingPath("$.code").isEqualTo("CSRF_INVALID");

        assertThat(put(mvc, "/api/v1/reflections/2026-10", WELL, session)).hasStatus(HttpStatus.OK);
        var deleteWithoutToken = withSession(mvc.delete().uri("/api/v1/reflections/2026-10"), session).exchange();
        assertThat(deleteWithoutToken).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reflections", Integer.class)).isEqualTo(1);
    }

    @Test
    void anotherUsersReflectionIsInvisibleAndUntouchable() {
        MockHttpSession alice = registerAndLogin(mvc, "alice@example.com");
        assertThat(put(mvc, "/api/v1/reflections/2026-10", WELL, alice)).hasStatus(HttpStatus.OK);

        MockHttpSession bob = registerAndLogin(mvc, "bob@example.com");
        var read = get(mvc, "/api/v1/reflections/2026-10", bob);
        assertThat(read).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(read).bodyJson().extractingPath("$.code").isEqualTo("REFLECTION_NOT_FOUND");
        assertThat(body(read)).doesNotContain("groceries");
        assertThat(delete(mvc, "/api/v1/reflections/2026-10", bob)).hasStatus(HttpStatus.NOT_FOUND);
        // Bob's edit with Alice's version cannot reach Alice's row.
        assertThat(put(mvc, "/api/v1/reflections/2026-10", edit(1, "what-went-well", "x"), bob))
                .hasStatus(HttpStatus.CONFLICT);
        assertThat(JsonPath.<List<?>>read(body(get(mvc, "/api/v1/reflections", bob)), "$.items")).isEmpty();

        // Bob can still write his own reflection for the same month.
        assertThat(put(mvc, "/api/v1/reflections/2026-10", WELL, bob)).hasStatus(HttpStatus.OK);
        assertThat(JsonPath.<String>read(body(get(mvc, "/api/v1/reflections/2026-10", alice)), "$.answers[0].answer"))
                .isEqualTo("Planned groceries before the week.");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reflections", Integer.class)).isEqualTo(2);
    }

    @Test
    void clientCannotChooseTheOwner() {
        MockHttpSession alice = registerAndLogin(mvc, "alice@example.com");
        registerAndLogin(mvc, "bob@example.com");
        UUID bob = userId("bob@example.com");
        var result = put(mvc, "/api/v1/reflections/2026-10", """
                {"userId": "%s", "answers": [{"questionId": "what-went-well", "answer": "Mine"}]}
                """.formatted(bob), alice);
        assertThat(result).hasStatus(HttpStatus.OK);
        assertThat(jdbc.queryForObject("SELECT user_id FROM reflections", UUID.class))
                .isEqualTo(userId("alice@example.com"));
    }

    // --- Create, read, edit, delete ---------------------------------------------

    @Test
    void missingReflectionIs404() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        var result = get(mvc, "/api/v1/reflections/2026-10", session);
        assertThat(result).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("REFLECTION_NOT_FOUND");
    }

    @Test
    void firstSaveCreatesVersionOneAndAnswersComeBackInQuestionOrder() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        var saved = put(mvc, "/api/v1/reflections/2026-10", """
                {"answers": [
                  {"questionId": "what-to-change", "answer": "  Review small purchases weekly.  "},
                  {"questionId": "what-felt-difficult", "answer": "   "},
                  {"questionId": "what-went-well", "answer": "Stayed within Needs."}
                ]}
                """, session);
        assertThat(saved).hasStatus(HttpStatus.OK);
        assertThat(saved).bodyJson().extractingPath("$.month").isEqualTo("2026-10");
        assertThat(saved).bodyJson().extractingPath("$.version").isEqualTo(1);
        assertThat(saved).bodyJson().extractingPath("$.questionSetVersion").isEqualTo(1);
        assertThat(JsonPath.<List<String>>read(body(saved), "$.answers[*].questionId"))
                .containsExactly("what-went-well", "what-to-change"); // blank answer dropped
        assertThat(JsonPath.<String>read(body(saved), "$.answers[1].answer"))
                .isEqualTo("Review small purchases weekly."); // surrounding whitespace removed

        var read = get(mvc, "/api/v1/reflections/2026-10", session);
        assertThat(read).hasStatus(HttpStatus.OK);
        assertThat(body(read)).isEqualTo(body(saved));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reflection_answers", Integer.class)).isEqualTo(2);
    }

    @Test
    void editWithTheCurrentVersionReplacesAllAnswersAndIncrementsVersion() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        put(mvc, "/api/v1/reflections/2026-10", """
                {"answers": [{"questionId": "what-went-well", "answer": "A"}, {"questionId": "what-to-change", "answer": "B"}]}
                """, session);

        var edited = put(mvc, "/api/v1/reflections/2026-10", edit(1, "what-felt-difficult", "C"), session);
        assertThat(edited).hasStatus(HttpStatus.OK);
        assertThat(edited).bodyJson().extractingPath("$.version").isEqualTo(2);
        assertThat(JsonPath.<List<String>>read(body(edited), "$.answers[*].questionId"))
                .containsExactly("what-felt-difficult");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reflection_answers", Integer.class)).isEqualTo(1);
    }

    @Test
    void staleVersionIsRejectedWithoutChangingAnything() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        put(mvc, "/api/v1/reflections/2026-10", WELL, session);
        put(mvc, "/api/v1/reflections/2026-10", edit(1, "what-went-well", "Second tab"), session);

        var stale = put(mvc, "/api/v1/reflections/2026-10", edit(1, "what-went-well", "First tab"), session);
        assertThat(stale).hasStatus(HttpStatus.CONFLICT);
        assertThat(stale).bodyJson().extractingPath("$.code").isEqualTo("REFLECTION_CONFLICT");
        assertThat(body(stale)).doesNotContain("Second tab").doesNotContain("First tab");
        assertThat(jdbc.queryForObject("SELECT answer FROM reflection_answers", String.class)).isEqualTo("Second tab");
        assertThat(jdbc.queryForObject("SELECT version FROM reflections", Integer.class)).isEqualTo(2);
    }

    @Test
    void firstSaveWhenOneAlreadyExistsIsAConflict() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        put(mvc, "/api/v1/reflections/2026-10", WELL, session);
        var duplicate = put(mvc, "/api/v1/reflections/2026-10", """
                {"answers": [{"questionId": "what-went-well", "answer": "Overwrite?"}]}
                """, session);
        assertThat(duplicate).hasStatus(HttpStatus.CONFLICT);
        assertThat(duplicate).bodyJson().extractingPath("$.code").isEqualTo("REFLECTION_CONFLICT");
        assertThat(jdbc.queryForObject("SELECT answer FROM reflection_answers", String.class))
                .isEqualTo("Planned groceries before the week.");
    }

    @Test
    void editAfterDeleteIsAConflictNotASilentRecreate() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        put(mvc, "/api/v1/reflections/2026-10", WELL, session);
        assertThat(delete(mvc, "/api/v1/reflections/2026-10", session)).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(put(mvc, "/api/v1/reflections/2026-10", edit(1, "what-went-well", "x"), session))
                .hasStatus(HttpStatus.CONFLICT);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reflections", Integer.class)).isZero();
    }

    @Test
    void deleteIsPermanentAndRemovesAnswers() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        put(mvc, "/api/v1/reflections/2026-10", WELL, session);
        assertThat(delete(mvc, "/api/v1/reflections/2026-10", session)).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(get(mvc, "/api/v1/reflections/2026-10", session)).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reflections", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reflection_answers", Integer.class)).isZero();
        assertThat(delete(mvc, "/api/v1/reflections/2026-10", session)).hasStatus(HttpStatus.NOT_FOUND);
        // A new first save is allowed again.
        assertThat(put(mvc, "/api/v1/reflections/2026-10", WELL, session)).bodyJson()
                .extractingPath("$.version").isEqualTo(1);
    }

    @Test
    void historyListsMonthsNewestFirstWithoutAnswerText() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        put(mvc, "/api/v1/reflections/2026-09", WELL, session);
        put(mvc, "/api/v1/reflections/2026-11", """
                {"answers": [{"questionId": "what-went-well", "answer": "A"}, {"questionId": "what-to-change", "answer": "B"}]}
                """, session);
        var list = get(mvc, "/api/v1/reflections", session);
        assertThat(list).hasStatus(HttpStatus.OK);
        assertThat(JsonPath.<List<String>>read(body(list), "$.items[*].month")).containsExactly("2026-11", "2026-09");
        assertThat(JsonPath.<List<Integer>>read(body(list), "$.items[*].answeredCount")).containsExactly(2, 1);
        assertThat(body(list)).doesNotContain("groceries").doesNotContain("\"answers\"").doesNotContain("\"answer\"");
    }

    @Test
    void removingTheAccountRemovesItsReflections() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        put(mvc, "/api/v1/reflections/2026-10", WELL, session);
        jdbc.update("DELETE FROM app_users WHERE email = 'alice@example.com'");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reflections", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reflection_answers", Integer.class)).isZero();
    }

    // --- Validation ----------------------------------------------------------------

    @Test
    void invalidMonthIsRejected() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        for (String month : new String[]{"2026-13", "2026-1", "x", "0999-01"}) {
            var result = get(mvc, "/api/v1/reflections/" + month, session);
            assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
            assertThat(result).bodyJson().extractingPath("$.fieldErrors.month").isNotNull();
        }
    }

    @Test
    void currentMonthIsAllowedButAFutureMonthIsNot() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        assertThat(put(mvc, "/api/v1/reflections/2026-11", WELL, session)).hasStatus(HttpStatus.OK);
        var future = put(mvc, "/api/v1/reflections/2026-12", WELL, session);
        assertThat(future).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(future).bodyJson().extractingPath("$.fieldErrors.month").isNotNull();
    }

    @Test
    void allBlankAndMissingAnswersAreRejected() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        var blank = put(mvc, "/api/v1/reflections/2026-10", """
                {"answers": [{"questionId": "what-went-well", "answer": "  "}, {"questionId": "what-to-change", "answer": null}]}
                """, session);
        assertThat(blank).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(blank).bodyJson().extractingPath("$.fieldErrors.answers").isNotNull();

        for (String json : new String[]{"{}", "{\"answers\": []}", "{\"answers\": null}"}) {
            var result = put(mvc, "/api/v1/reflections/2026-10", json, session);
            assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
            assertThat(result).bodyJson().extractingPath("$.fieldErrors.answers").isNotNull();
        }
        var noBody = withSession(com.divido.CsrfSupport.fetch(mvc).apply(mvc.put().uri("/api/v1/reflections/2026-10")),
                session).exchange();
        assertThat(noBody).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reflections", Integer.class)).isZero();
    }

    @Test
    void unknownOrRepeatedQuestionsAreRejected() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        String[] bodies = {
                "{\"answers\": [{\"questionId\": \"how-much-saved\", \"answer\": \"x\"}]}",
                "{\"answers\": [{\"answer\": \"x\"}]}",
                "{\"answers\": [null]}",
                "{\"answers\": [{\"questionId\": \"what-went-well\", \"answer\": \"a\"}, {\"questionId\": \"what-went-well\", \"answer\": \"b\"}]}",
                "{\"answers\": [{\"questionId\": \"what-went-well\", \"answer\": \"a\"}, {\"questionId\": \"what-felt-difficult\", \"answer\": \"b\"},"
                        + " {\"questionId\": \"what-to-change\", \"answer\": \"c\"}, {\"questionId\": \"what-to-change\", \"answer\": \"d\"}]}"
        };
        for (String json : bodies) {
            var result = put(mvc, "/api/v1/reflections/2026-10", json, session);
            assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
            assertThat(result).bodyJson().extractingPath("$.fieldErrors.answers").isNotNull();
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reflections", Integer.class)).isZero();
    }

    @Test
    void answersUpTo2000CharactersAreAcceptedAndLongerAreRejected() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        String exact = "a".repeat(2000);
        assertThat(put(mvc, "/api/v1/reflections/2026-10", """
                {"answers": [{"questionId": "what-went-well", "answer": "%s"}]}
                """.formatted(exact), session)).hasStatus(HttpStatus.OK);

        // 2,000 emoji are 4,000 UTF-16 units but 2,000 characters: accepted.
        String emoji = "😀".repeat(2000);
        assertThat(put(mvc, "/api/v1/reflections/2026-09", """
                {"answers": [{"questionId": "what-went-well", "answer": "%s"}]}
                """.formatted(emoji), session)).hasStatus(HttpStatus.OK);

        var tooLong = put(mvc, "/api/v1/reflections/2026-08", """
                {"answers": [{"questionId": "what-to-change", "answer": "%s"}]}
                """.formatted("a".repeat(2001)), session);
        assertThat(tooLong).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(tooLong).bodyJson().extractingPath("$.fieldErrors['answers.what-to-change']").isNotNull();
        assertThat(body(tooLong)).doesNotContain("aaaa");
    }

    @Test
    void nonPositiveVersionIsRejected() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        var result = put(mvc, "/api/v1/reflections/2026-10", edit(0, "what-went-well", "x"), session);
        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.fieldErrors.version").isNotNull();
    }

    @Test
    void databaseRejectsBlankOrOverLongAnswersEvenWithoutTheService() {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        put(mvc, "/api/v1/reflections/2026-10", WELL, session);
        UUID id = jdbc.queryForObject("SELECT id FROM reflections", UUID.class);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO reflection_answers (reflection_id, question_id, answer) VALUES (?, 'what-to-change', '  ')", id))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO reflection_answers (reflection_id, question_id, answer) VALUES (?, 'what-to-change', ?)",
                id, "a".repeat(2001)))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO reflections (user_id, reflection_month, question_set_version) VALUES (?, '2026-10-02', 1)",
                userId("alice@example.com")))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    // --- Concurrency (DEC-039) -------------------------------------------------------

    @Test
    void simultaneousFirstSavesNeverOverwriteEachOther() throws Exception {
        registerAndLogin(mvc, "alice@example.com");
        UUID alice = userId("alice@example.com");
        int writers = 6;
        List<Integer> outcomes = runConcurrently(writers, i -> reflectionService.saveReflection(alice, "2026-10",
                new ReflectionRequest(null, List.of(new ReflectionAnswerDto("what-went-well", "Writer " + i)))));
        assertThat(outcomes.stream().filter(o -> o == 200).count()).isEqualTo(1);
        assertThat(outcomes.stream().filter(o -> o == 409).count()).isEqualTo(writers - 1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reflections", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT version FROM reflections", Integer.class)).isEqualTo(1);
    }

    @Test
    void simultaneousEditsFromTheSameVersionLetExactlyOneWin() throws Exception {
        MockHttpSession session = registerAndLogin(mvc, "alice@example.com");
        put(mvc, "/api/v1/reflections/2026-10", WELL, session);
        UUID alice = userId("alice@example.com");
        int writers = 6;
        List<Integer> outcomes = runConcurrently(writers, i -> reflectionService.saveReflection(alice, "2026-10",
                new ReflectionRequest(1, List.of(new ReflectionAnswerDto("what-went-well", "Writer " + i)))));
        assertThat(outcomes.stream().filter(o -> o == 200).count()).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT version FROM reflections", Integer.class)).isEqualTo(2);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reflection_answers", Integer.class)).isEqualTo(1);
    }

    private interface Save {
        void run(int index) throws Exception;
    }

    private static List<Integer> runConcurrently(int writers, Save save) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(writers);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Integer>> futures = new ArrayList<>();
        try {
            for (int i = 0; i < writers; i++) {
                int index = i;
                futures.add(pool.submit(() -> {
                    start.await();
                    save.run(index);
                    return 200;
                }));
            }
            start.countDown();
            List<Integer> outcomes = new ArrayList<>();
            for (Future<Integer> future : futures) {
                try {
                    outcomes.add(future.get(30, TimeUnit.SECONDS));
                } catch (ExecutionException ex) {
                    assertThat(ex.getCause()).isInstanceOf(ReflectionConflictException.class);
                    outcomes.add(409);
                }
            }
            return outcomes;
        } finally {
            pool.shutdownNow();
        }
    }
}
