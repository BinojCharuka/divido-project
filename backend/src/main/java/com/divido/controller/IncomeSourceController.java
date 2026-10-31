package com.divido.controller;

import com.divido.dto.IncomeSourceCreateRequest;
import com.divido.dto.IncomeSourceListResponse;
import com.divido.dto.IncomeSourceResponse;
import com.divido.dto.IncomeSourceUpdateRequest;
import com.divido.security.DividoUserDetails;
import com.divido.service.IncomeSourceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/income-sources")
public class IncomeSourceController {

    private final IncomeSourceService incomeSourceService;

    public IncomeSourceController(IncomeSourceService incomeSourceService) {
        this.incomeSourceService = incomeSourceService;
    }

    @GetMapping
    public IncomeSourceListResponse listIncomeSources(
            @RequestParam(defaultValue = "false") boolean includeInactive,
            @AuthenticationPrincipal DividoUserDetails user) {
        return new IncomeSourceListResponse(incomeSourceService.listIncomeSources(user.getId(), includeInactive));
    }

    @PostMapping
    public ResponseEntity<IncomeSourceResponse> createIncomeSource(
            @Valid @RequestBody IncomeSourceCreateRequest request,
            @AuthenticationPrincipal DividoUserDetails user) {
        IncomeSourceResponse response = incomeSourceService.createIncomeSource(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{sourceId}")
    public ResponseEntity<IncomeSourceResponse> updateIncomeSource(
            @PathVariable UUID sourceId,
            @Valid @RequestBody IncomeSourceUpdateRequest request,
            @AuthenticationPrincipal DividoUserDetails user) {
        IncomeSourceResponse response = incomeSourceService.updateIncomeSource(user.getId(), sourceId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{sourceId}/deactivate")
    public ResponseEntity<Void> deactivateIncomeSource(
            @PathVariable UUID sourceId,
            @AuthenticationPrincipal DividoUserDetails user) {
        incomeSourceService.deactivateIncomeSource(user.getId(), sourceId);
        return ResponseEntity.noContent().build();
    }
}
