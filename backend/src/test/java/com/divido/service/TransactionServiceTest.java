package com.divido.service;

import com.divido.dto.TransactionCreateRequest;
import com.divido.dto.TransactionUpdateRequest;
import com.divido.entity.Category;
import com.divido.entity.Transaction;
import com.divido.entity.TransactionType;
import com.divido.exception.FieldValidationException;
import com.divido.repository.CategoryRepository;
import com.divido.repository.IncomeSourceRepository;
import com.divido.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TransactionServiceTest {

    private TransactionRepository transactionRepository;
    private CategoryRepository categoryRepository;
    private IncomeSourceRepository incomeSourceRepository;
    private TransactionService service;

    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        transactionRepository = mock(TransactionRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        incomeSourceRepository = mock(IncomeSourceRepository.class);
        service = new TransactionService(transactionRepository, categoryRepository, incomeSourceRepository);
    }

    @Test
    void cleanStringEnforcesDescriptionMaxLengthAndEmitsExactFieldKeyOnCreate() {
        TransactionCreateRequest request = new TransactionCreateRequest(
                TransactionType.INCOME,
                "100.00",
                LocalDate.now(),
                null,
                null,
                "a".repeat(501),
                null
        );

        assertThatThrownBy(() -> service.createTransaction(userId, request))
                .isInstanceOf(FieldValidationException.class)
                .satisfies(ex -> {
                    FieldValidationException fve = (FieldValidationException) ex;
                    assertThat(fve.getField()).isEqualTo("description");
                    assertThat(fve.getMessage()).isEqualTo("Description must not exceed 500 characters.");
                });
    }

    @Test
    void cleanStringEnforcesPaymentMethodMaxLengthAndEmitsExactFieldKeyOnCreate() {
        TransactionCreateRequest request = new TransactionCreateRequest(
                TransactionType.INCOME,
                "100.00",
                LocalDate.now(),
                null,
                null,
                null,
                "b".repeat(51)
        );

        assertThatThrownBy(() -> service.createTransaction(userId, request))
                .isInstanceOf(FieldValidationException.class)
                .satisfies(ex -> {
                    FieldValidationException fve = (FieldValidationException) ex;
                    assertThat(fve.getField()).isEqualTo("paymentMethod");
                    assertThat(fve.getMessage()).isEqualTo("Payment method must not exceed 50 characters.");
                });
    }

    @Test
    void cleanStringEnforcesDescriptionMaxLengthAndEmitsExactFieldKeyOnUpdate() {
        UUID txId = UUID.randomUUID();
        Transaction existing = new Transaction(
                userId, TransactionType.EXPENSE, new BigDecimal("50.00"), LocalDate.now(),
                mock(Category.class), null, "Existing description", "Cash"
        );
        when(transactionRepository.findByIdAndUserId(txId, userId)).thenReturn(Optional.of(existing));

        TransactionUpdateRequest update = new TransactionUpdateRequest();
        update.setDescription("a".repeat(501));

        assertThatThrownBy(() -> service.updateTransaction(userId, txId, update))
                .isInstanceOf(FieldValidationException.class)
                .satisfies(ex -> {
                    FieldValidationException fve = (FieldValidationException) ex;
                    assertThat(fve.getField()).isEqualTo("description");
                    assertThat(fve.getMessage()).isEqualTo("Description must not exceed 500 characters.");
                });
    }

    @Test
    void cleanStringEnforcesPaymentMethodMaxLengthAndEmitsExactFieldKeyOnUpdate() {
        UUID txId = UUID.randomUUID();
        Transaction existing = new Transaction(
                userId, TransactionType.EXPENSE, new BigDecimal("50.00"), LocalDate.now(),
                mock(Category.class), null, "Existing description", "Cash"
        );
        when(transactionRepository.findByIdAndUserId(txId, userId)).thenReturn(Optional.of(existing));

        TransactionUpdateRequest update = new TransactionUpdateRequest();
        update.setPaymentMethod("b".repeat(51));

        assertThatThrownBy(() -> service.updateTransaction(userId, txId, update))
                .isInstanceOf(FieldValidationException.class)
                .satisfies(ex -> {
                    FieldValidationException fve = (FieldValidationException) ex;
                    assertThat(fve.getField()).isEqualTo("paymentMethod");
                    assertThat(fve.getMessage()).isEqualTo("Payment method must not exceed 50 characters.");
                });
    }

    @Test
    void deleteAllTransactionsDelegatesToRepository() {
        service.deleteAllTransactions(userId);
        verify(transactionRepository).deleteAllByUserId(userId);
    }
}
