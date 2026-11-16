package com.divido.controller;

import com.divido.dto.ReflectionListResponse;
import com.divido.dto.ReflectionRequest;
import com.divido.dto.ReflectionResponse;
import com.divido.security.DividoUserDetails;
import com.divido.service.ReflectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** REFLECTION-001 to REFLECTION-004 (DIV-028). The owner is always the signed-in user. */
@RestController
@RequestMapping("/api/v1/reflections")
public class ReflectionController {

    private final ReflectionService reflectionService;

    public ReflectionController(ReflectionService reflectionService) {
        this.reflectionService = reflectionService;
    }

    @GetMapping
    public ReflectionListResponse listReflections(@AuthenticationPrincipal DividoUserDetails user) {
        return reflectionService.listReflections(user.getId());
    }

    @GetMapping("/{month}")
    public ReflectionResponse getReflection(@PathVariable String month,
                                            @AuthenticationPrincipal DividoUserDetails user) {
        return reflectionService.getReflection(user.getId(), month);
    }

    /** Creates (no {@code version}) or edits (current {@code version}); always {@code 200 OK}. */
    @PutMapping("/{month}")
    public ReflectionResponse saveReflection(@PathVariable String month,
                                             @RequestBody(required = false) ReflectionRequest request,
                                             @AuthenticationPrincipal DividoUserDetails user) {
        return reflectionService.saveReflection(user.getId(), month, request);
    }

    @DeleteMapping("/{month}")
    public ResponseEntity<Void> deleteReflection(@PathVariable String month,
                                                 @AuthenticationPrincipal DividoUserDetails user) {
        reflectionService.deleteReflection(user.getId(), month);
        return ResponseEntity.noContent().build();
    }
}
