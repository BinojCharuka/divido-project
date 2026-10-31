package com.divido.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public class TransactionUpdateRequest {

    private String amount;
    private boolean amountPresent;

    private LocalDate date;
    private boolean datePresent;

    private UUID categoryId;
    private boolean categoryIdPresent;

    private UUID incomeSourceId;
    private boolean incomeSourceIdPresent;

    @Size(max = 500, message = "Description must not exceed 500 characters.")
    private String description;
    private boolean descriptionPresent;

    @Size(max = 50, message = "Payment method must not exceed 50 characters.")
    private String paymentMethod;
    private boolean paymentMethodPresent;

    public TransactionUpdateRequest() {
    }

    @JsonProperty("amount")
    public void setAmount(String amount) {
        this.amount = amount;
        this.amountPresent = true;
    }

    public String getAmount() {
        return amount;
    }

    public boolean isAmountPresent() {
        return amountPresent;
    }

    @JsonProperty("date")
    public void setDate(LocalDate date) {
        this.date = date;
        this.datePresent = true;
    }

    public LocalDate getDate() {
        return date;
    }

    public boolean isDatePresent() {
        return datePresent;
    }

    @JsonProperty("categoryId")
    public void setCategoryId(UUID categoryId) {
        this.categoryId = categoryId;
        this.categoryIdPresent = true;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public boolean isCategoryIdPresent() {
        return categoryIdPresent;
    }

    @JsonProperty("incomeSourceId")
    public void setIncomeSourceId(UUID incomeSourceId) {
        this.incomeSourceId = incomeSourceId;
        this.incomeSourceIdPresent = true;
    }

    public UUID getIncomeSourceId() {
        return incomeSourceId;
    }

    public boolean isIncomeSourceIdPresent() {
        return incomeSourceIdPresent;
    }

    @JsonProperty("description")
    public void setDescription(String description) {
        this.description = description;
        this.descriptionPresent = true;
    }

    public String getDescription() {
        return description;
    }

    public boolean isDescriptionPresent() {
        return descriptionPresent;
    }

    @JsonProperty("paymentMethod")
    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
        this.paymentMethodPresent = true;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public boolean isPaymentMethodPresent() {
        return paymentMethodPresent;
    }
}
