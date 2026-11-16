package com.divido.controller;

import com.divido.dto.InsightsResponse;
import com.divido.security.DividoUserDetails;
import com.divido.service.InsightsService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** INSIGHT-001 (DIV-027, DEC-033). Omitting {@code month} selects the current month in the user's timezone. */
@RestController
@RequestMapping("/api/v1/insights")
public class InsightsController {

    private final InsightsService insightsService;

    public InsightsController(InsightsService insightsService) {
        this.insightsService = insightsService;
    }

    @GetMapping
    public InsightsResponse getInsights(@RequestParam(required = false) String month,
                                        @AuthenticationPrincipal DividoUserDetails user) {
        return insightsService.getInsights(user.getId(), month);
    }
}
