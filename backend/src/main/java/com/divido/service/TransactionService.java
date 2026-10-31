package com.divido.service;

import com.divido.dto.TransactionCreateRequest;
import com.divido.dto.TransactionPageResponse;
import com.divido.dto.TransactionResponse;
import com.divido.dto.TransactionUpdateRequest;
import com.divido.entity.Category;
import com.divido.entity.IncomeSource;
import com.divido.entity.Transaction;
import com.divido.entity.TransactionType;
import com.divido.exception.FieldValidationException;
import com.divido.exception.ResourceNotFoundException;
import com.divido.repository.CategoryRepository;
import com.divido.repository.IncomeSourceRepository;
import com.divido.repository.TransactionRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class TransactionService {

    private static final BigDecimal MAX_AMOUNT = new BigDecimal("9999999999.99");

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final IncomeSourceRepository incomeSourceRepository;

    public TransactionService(TransactionRepository transactionRepository,
                              CategoryRepository categoryRepository,
                              IncomeSourceRepository incomeSourceRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.incomeSourceRepository = incomeSourceRepository;
    }

    public TransactionResponse createTransaction(UUID userId, TransactionCreateRequest request) {
        BigDecimal amount = parseAndValidateAmount(request.amount());

        if (request.date() == null) {
            throw new FieldValidationException("date", "Date is required.");
        }

        String description = cleanString(request.description(), 500, "description", "Description");
        String paymentMethod = cleanString(request.paymentMethod(), 50, "paymentMethod", "Payment method");

        Category category = null;
        IncomeSource incomeSource = null;

        if (request.type() == TransactionType.EXPENSE) {
            if (request.categoryId() == null) {
                throw new FieldValidationException("categoryId", "Category is required for expenses.");
            }
            if (request.incomeSourceId() != null) {
                throw new FieldValidationException("incomeSourceId", "Income source cannot be specified for expenses.");
            }
            category = validateAndGetCategory(request.categoryId(), userId);
        } else if (request.type() == TransactionType.INCOME) {
            if (request.categoryId() != null) {
                throw new FieldValidationException("categoryId", "Category cannot be specified for income.");
            }
            if (request.incomeSourceId() != null) {
                incomeSource = validateAndGetIncomeSource(request.incomeSourceId(), userId);
            }
        }

        Transaction transaction = new Transaction(
                userId,
                request.type(),
                amount,
                request.date(),
                category,
                incomeSource,
                description,
                paymentMethod
        );

        Transaction saved = transactionRepository.saveAndFlush(transaction);
        return TransactionResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransaction(UUID userId, UUID transactionId) {
        Transaction tx = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found."));
        return TransactionResponse.fromEntity(tx);
    }

    public TransactionResponse updateTransaction(UUID userId, UUID transactionId, TransactionUpdateRequest request) {
        Transaction tx = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found."));

        if (request.isAmountPresent()) {
            tx.setAmount(parseAndValidateAmount(request.getAmount()));
        }

        if (request.isDatePresent()) {
            if (request.getDate() == null) {
                throw new FieldValidationException("date", "Date cannot be null.");
            }
            tx.setDate(request.getDate());
        }

        if (request.isCategoryIdPresent()) {
            if (tx.getType() == TransactionType.INCOME) {
                if (request.getCategoryId() != null) {
                    throw new FieldValidationException("categoryId", "Category cannot be specified for income.");
                }
            } else {
                if (request.getCategoryId() == null) {
                    throw new FieldValidationException("categoryId", "Category is required for expenses.");
                }
                Category category = validateAndGetCategory(request.getCategoryId(), userId);
                tx.setCategory(category);
            }
        }

        if (request.isIncomeSourceIdPresent()) {
            if (tx.getType() == TransactionType.EXPENSE) {
                if (request.getIncomeSourceId() != null) {
                    throw new FieldValidationException("incomeSourceId", "Income source cannot be specified for expenses.");
                }
            } else {
                if (request.getIncomeSourceId() == null) {
                    tx.setIncomeSource(null);
                } else {
                    IncomeSource incomeSource = validateAndGetIncomeSource(request.getIncomeSourceId(), userId);
                    tx.setIncomeSource(incomeSource);
                }
            }
        }

        if (request.isDescriptionPresent()) {
            tx.setDescription(cleanString(request.getDescription(), 500, "description", "Description"));
        }

        if (request.isPaymentMethodPresent()) {
            tx.setPaymentMethod(cleanString(request.getPaymentMethod(), 50, "paymentMethod", "Payment method"));
        }

        tx.setUpdatedAt(Instant.now());
        Transaction saved = transactionRepository.saveAndFlush(tx);
        return TransactionResponse.fromEntity(saved);
    }

    public void deleteTransaction(UUID userId, UUID transactionId) {
        Transaction tx = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found."));
        transactionRepository.delete(tx);
    }

    @Transactional(readOnly = true)
    public TransactionPageResponse listTransactions(
            UUID userId,
            int page,
            int size,
            TransactionType type,
            LocalDate from,
            LocalDate to,
            UUID categoryId,
            UUID incomeSourceId) {

        if (page < 0) {
            throw new FieldValidationException("page", "Page index cannot be negative.");
        }
        if (size < 1 || size > 100) {
            throw new FieldValidationException("size", "Page size must be between 1 and 100.");
        }
        if (from != null && to != null && from.isAfter(to)) {
            throw new FieldValidationException("from", "The 'from' date must be on or before the 'to' date.");
        }

        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Strictly scope every query to the authenticated user
            predicates.add(cb.equal(root.get("userId"), userId));

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), to));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (incomeSourceId != null) {
                predicates.add(cb.equal(root.get("incomeSource").get("id"), incomeSourceId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("date"), Sort.Order.desc("createdAt")));
        Page<Transaction> result = transactionRepository.findAll(spec, pageable);

        List<TransactionResponse> items = result.getContent().stream()
                .map(TransactionResponse::fromEntity)
                .toList();

        return new TransactionPageResponse(
                items,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    private BigDecimal parseAndValidateAmount(String amountStr) {
        if (amountStr == null || amountStr.isBlank()) {
            throw new FieldValidationException("amount", "Amount is required.");
        }

        String trimmed = amountStr.trim();
        if (!trimmed.matches("^\\d+(\\.\\d{1,2})?$")) {
            throw new FieldValidationException("amount", "Amount must be a positive number with at most 2 decimal places.");
        }

        try {
            BigDecimal bd = new BigDecimal(trimmed);
            if (bd.compareTo(BigDecimal.ZERO) <= 0) {
                throw new FieldValidationException("amount", "Amount must be greater than zero.");
            }
            if (bd.scale() > 2) {
                throw new FieldValidationException("amount", "Amount must have at most 2 decimal places.");
            }
            if (bd.compareTo(MAX_AMOUNT) > 0) {
                throw new FieldValidationException("amount", "Amount exceeds maximum allowed limit.");
            }
            return bd.setScale(2, RoundingMode.UNNECESSARY);
        } catch (NumberFormatException ex) {
            throw new FieldValidationException("amount", "Invalid amount format.");
        }
    }

    private Category validateAndGetCategory(UUID categoryId, UUID userId) {
        Category category = categoryRepository.findUsableCategoryById(categoryId, userId)
                .orElseThrow(() -> new FieldValidationException("categoryId", "Category not found."));
        if (!category.isActive()) {
            throw new FieldValidationException("categoryId", "Category is inactive.");
        }
        return category;
    }

    private IncomeSource validateAndGetIncomeSource(UUID incomeSourceId, UUID userId) {
        IncomeSource incomeSource = incomeSourceRepository.findByIdAndUserId(incomeSourceId, userId)
                .orElseThrow(() -> new FieldValidationException("incomeSourceId", "Income source not found."));
        if (!incomeSource.isActive()) {
            throw new FieldValidationException("incomeSourceId", "Income source is inactive.");
        }
        return incomeSource;
    }

    private String cleanString(String input, int maxLength, String fieldKey, String fieldLabel) {
        if (input == null) {
            return null;
        }
        String trimmed = input.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() > maxLength) {
            throw new FieldValidationException(fieldKey, fieldLabel + " must not exceed " + maxLength + " characters.");
        }
        return trimmed;
    }
}
