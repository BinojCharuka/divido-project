package com.divido.controller;

import com.divido.dto.DashboardResponse;
import com.divido.security.DividoUserDetails;
import com.divido.service.DashboardService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** DASH-001. Omitting {@code month} selects the current month in the user's timezone. */
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public DashboardResponse getDashboard(@RequestParam(required = false) String month,
                                          @AuthenticationPrincipal DividoUserDetails user) {
        return dashboardService.getDashboard(user.getId(), month);
    }
}
