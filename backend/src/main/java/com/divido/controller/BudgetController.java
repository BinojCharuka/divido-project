package com.divido.controller;

import com.divido.dto.MonthlyBudgetRequest;
import com.divido.dto.MonthlyBudgetResponse;
import com.divido.security.DividoUserDetails;
import com.divido.service.BudgetService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** BUDGET-001 and BUDGET-002. The owner is always the signed-in user. */
@RestController
@RequestMapping("/api/v1/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping("/{month}")
    public MonthlyBudgetResponse getBudget(@PathVariable String month,
                                           @AuthenticationPrincipal DividoUserDetails user) {
        return budgetService.getBudget(user.getId(), month);
    }

    /** Creates or replaces the month's plan; always {@code 200 OK} with the stored plan. */
    @PutMapping("/{month}")
    public MonthlyBudgetResponse saveBudget(@PathVariable String month,
                                            @RequestBody(required = false) MonthlyBudgetRequest request,
                                            @AuthenticationPrincipal DividoUserDetails user) {
        return budgetService.saveBudget(user.getId(), month, request);
    }
}
