package com.divido.controller;

import com.divido.dto.TransactionCreateRequest;
import com.divido.dto.TransactionPageResponse;
import com.divido.dto.TransactionResponse;
import com.divido.dto.TransactionUpdateRequest;
import com.divido.entity.TransactionType;
import com.divido.security.DividoUserDetails;
import com.divido.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public TransactionPageResponse listTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID incomeSourceId,
            @AuthenticationPrincipal DividoUserDetails user) {
        return transactionService.listTransactions(user.getId(), page, size, type, from, to, categoryId, incomeSourceId);
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
            @Valid @RequestBody TransactionCreateRequest request,
            @AuthenticationPrincipal DividoUserDetails user) {
        TransactionResponse response = transactionService.createTransaction(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionResponse> getTransaction(
            @PathVariable UUID transactionId,
            @AuthenticationPrincipal DividoUserDetails user) {
        TransactionResponse response = transactionService.getTransaction(user.getId(), transactionId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{transactionId}")
    public ResponseEntity<TransactionResponse> updateTransaction(
            @PathVariable UUID transactionId,
            @Valid @RequestBody TransactionUpdateRequest request,
            @AuthenticationPrincipal DividoUserDetails user) {
        TransactionResponse response = transactionService.updateTransaction(user.getId(), transactionId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{transactionId}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable UUID transactionId,
            @AuthenticationPrincipal DividoUserDetails user) {
        transactionService.deleteTransaction(user.getId(), transactionId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAllTransactions(@AuthenticationPrincipal DividoUserDetails user) {
        transactionService.deleteAllTransactions(user.getId());
        return ResponseEntity.noContent().build();
    }
}
