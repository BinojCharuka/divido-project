package com.divido.service;

import com.divido.dto.IncomeSourceCreateRequest;
import com.divido.dto.IncomeSourceResponse;
import com.divido.dto.IncomeSourceUpdateRequest;
import com.divido.entity.IncomeSource;
import com.divido.exception.ConflictException;
import com.divido.exception.ResourceNotFoundException;
import com.divido.repository.IncomeSourceRepository;
import com.divido.exception.FieldValidationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class IncomeSourceService {

    private final IncomeSourceRepository incomeSourceRepository;

    public IncomeSourceService(IncomeSourceRepository incomeSourceRepository) {
        this.incomeSourceRepository = incomeSourceRepository;
    }

    @Transactional(readOnly = true)
    public List<IncomeSourceResponse> listIncomeSources(UUID userId, boolean includeInactive) {
        return incomeSourceRepository.findByUserId(userId, !includeInactive).stream()
                .map(IncomeSourceResponse::fromEntity)
                .toList();
    }

    public IncomeSourceResponse createIncomeSource(UUID userId, IncomeSourceCreateRequest request) {
        String normalizedName = request.name().trim();
        if (incomeSourceRepository.existsByNameForUser(userId, normalizedName, null)) {
            throw new ConflictException("An income source named '" + normalizedName + "' already exists.");
        }

        IncomeSource source = new IncomeSource(userId, normalizedName);
        try {
            IncomeSource saved = incomeSourceRepository.saveAndFlush(source);
            return IncomeSourceResponse.fromEntity(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("An income source named '" + normalizedName + "' already exists.");
        }
    }

    public IncomeSourceResponse updateIncomeSource(UUID userId, UUID sourceId, IncomeSourceUpdateRequest request) {
        IncomeSource source = incomeSourceRepository.findByIdAndUserId(sourceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Income source not found."));

        if (request.name() != null) {
            String newName = request.name().trim();
            if (newName.isEmpty()) {
                throw new FieldValidationException("name", "Income source name cannot be blank.");
            }
            if (!newName.equalsIgnoreCase(source.getName())) {
                if (incomeSourceRepository.existsByNameForUser(userId, newName, sourceId)) {
                    throw new ConflictException("An income source named '" + newName + "' already exists.");
                }
                source.setName(newName);
            }
        }

        source.setUpdatedAt(Instant.now());
        try {
            IncomeSource saved = incomeSourceRepository.saveAndFlush(source);
            return IncomeSourceResponse.fromEntity(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("An income source with this name already exists.");
        }
    }

    public void deactivateIncomeSource(UUID userId, UUID sourceId) {
        IncomeSource source = incomeSourceRepository.findByIdAndUserId(sourceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Income source not found."));

        source.setActive(false);
        source.setUpdatedAt(Instant.now());
        incomeSourceRepository.save(source);
    }
}
