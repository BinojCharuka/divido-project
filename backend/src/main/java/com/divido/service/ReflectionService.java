package com.divido.service;

import com.divido.dto.ReflectionAnswerDto;
import com.divido.dto.ReflectionListResponse;
import com.divido.dto.ReflectionRequest;
import com.divido.dto.ReflectionResponse;
import com.divido.entity.AppUser;
import com.divido.exception.FieldValidationException;
import com.divido.exception.ReflectionConflictException;
import com.divido.exception.ReflectionNotFoundException;
import com.divido.exception.ValidationErrorsException;
import com.divido.repository.AppUserRepository;
import com.divido.repository.ReflectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Monthly reflection (DIV-028). Rules: DEC-034 (question set v1), DEC-035 (2,000
 * characters), DEC-038 (edit any time, permanent delete, no drafts, no analytics),
 * DEC-039 (optimistic version check), DEC-040 (blank answers dropped; all-blank
 * saves and future months rejected). Every operation is scoped to the session user.
 * Answer text is never logged or included in error messages.
 */
@Service
@Transactional
public class ReflectionService {

    /** DEC-035, counted in Unicode code points to match PostgreSQL {@code char_length}. */
    public static final int MAX_ANSWER_LENGTH = 2000;

    private final ReflectionRepository repository;
    private final AppUserRepository userRepository;
    private final Clock clock;

    public ReflectionService(ReflectionRepository repository, AppUserRepository userRepository, Clock clock) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ReflectionResponse getReflection(UUID userId, String rawMonth) {
        YearMonth month = BudgetMonth.parse(rawMonth);
        return read(userId, month).orElseThrow(ReflectionNotFoundException::new);
    }

    @Transactional(readOnly = true)
    public ReflectionListResponse listReflections(UUID userId) {
        List<ReflectionListResponse.Item> items = new ArrayList<>();
        for (ReflectionRepository.SummaryRow row : repository.summaries(userId)) {
            items.add(new ReflectionListResponse.Item(
                    YearMonth.from(row.month()).toString(), row.answeredCount(), row.updatedAt()));
        }
        return new ReflectionListResponse(items);
    }

    public ReflectionResponse saveReflection(UUID userId, String rawMonth, ReflectionRequest request) {
        YearMonth month = BudgetMonth.parse(rawMonth);
        rejectFutureMonth(userId, month);
        if (request == null || request.answers() == null) {
            throw new FieldValidationException("answers", "Answers are required.");
        }
        Integer version = request.version();
        if (version != null && version < 1) {
            throw new FieldValidationException("version", "Version must be a positive number.");
        }

        Map<String, String> answers = parseAnswers(request.answers());
        LocalDate firstDay = BudgetMonth.firstDay(month);
        int questionSet = ReflectionQuestions.CURRENT_VERSION;

        UUID reflectionId = (version == null
                ? repository.insertIfAbsent(userId, firstDay, questionSet)
                : repository.bumpVersion(userId, firstDay, version, questionSet))
                .orElseThrow(ReflectionConflictException::new);
        repository.replaceAnswers(reflectionId, answers);

        return read(userId, month).orElseThrow(() -> new IllegalStateException("Saved reflection was not found."));
    }

    public void deleteReflection(UUID userId, String rawMonth) {
        YearMonth month = BudgetMonth.parse(rawMonth);
        if (!repository.delete(userId, BudgetMonth.firstDay(month))) {
            throw new ReflectionNotFoundException();
        }
    }

    private void rejectFutureMonth(UUID userId, YearMonth month) {
        String timezone = userRepository.findById(userId).map(AppUser::getTimezone).orElse(null);
        if (month.isAfter(BudgetMonth.current(clock, timezone))) {
            throw new FieldValidationException("month", "You can only reflect on the current or a past month.");
        }
    }

    /**
     * Validates every answer and returns the non-blank ones in question order.
     * Unknown or repeated question ids and over-long answers are reported per field.
     */
    private static Map<String, String> parseAnswers(List<ReflectionAnswerDto> raw) {
        List<String> questions = ReflectionQuestions.current();
        Map<String, String> errors = new LinkedHashMap<>();
        Map<String, String> byQuestion = new LinkedHashMap<>();
        Set<String> seen = new HashSet<>();

        if (raw.size() > questions.size()) {
            errors.put("answers", "Too many answers.");
        }
        for (ReflectionAnswerDto item : raw) {
            if (item == null || item.questionId() == null || !questions.contains(item.questionId())) {
                errors.putIfAbsent("answers", "Answers may only use the current reflection questions.");
                continue;
            }
            String questionId = item.questionId();
            if (!seen.add(questionId)) {
                errors.putIfAbsent("answers", "Each question can be answered only once.");
                continue;
            }
            String answer = item.answer() == null ? "" : item.answer().strip();
            if (answer.codePointCount(0, answer.length()) > MAX_ANSWER_LENGTH) {
                errors.put("answers." + questionId, "Answers can be at most " + MAX_ANSWER_LENGTH + " characters.");
                continue;
            }
            if (!answer.isEmpty()) {
                byQuestion.put(questionId, answer);
            }
        }
        if (!errors.isEmpty()) {
            throw new ValidationErrorsException(errors);
        }
        if (byQuestion.isEmpty()) {
            throw new FieldValidationException("answers", "Write an answer to at least one question before saving.");
        }

        Map<String, String> ordered = new LinkedHashMap<>();
        for (String question : questions) {
            if (byQuestion.containsKey(question)) {
                ordered.put(question, byQuestion.get(question));
            }
        }
        return ordered;
    }

    private java.util.Optional<ReflectionResponse> read(UUID userId, YearMonth month) {
        return repository.find(userId, BudgetMonth.firstDay(month)).map(row -> {
            Map<String, String> stored = repository.answers(row.id());
            List<ReflectionAnswerDto> answers = new ArrayList<>();
            for (String question : ReflectionQuestions.current()) {
                if (stored.containsKey(question)) {
                    answers.add(new ReflectionAnswerDto(question, stored.get(question)));
                }
            }
            // Answers to questions outside the current set (a future set change) stay readable.
            for (Map.Entry<String, String> entry : stored.entrySet()) {
                if (!ReflectionQuestions.current().contains(entry.getKey())) {
                    answers.add(new ReflectionAnswerDto(entry.getKey(), entry.getValue()));
                }
            }
            return new ReflectionResponse(month.toString(), row.questionSetVersion(), row.version(),
                    answers, row.createdAt(), row.updatedAt());
        });
    }
}
