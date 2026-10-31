package com.divido.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Generated;

import java.time.Instant;
import java.util.UUID;

/**
 * Category entity mapping the {@code categories} table.
 * Global default categories have {@code userId == null} (DEC-013).
 * Custom categories have {@code userId != null}.
 */
@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String slug;

    @Convert(converter = KakeiboGroupConverter.class)
    @Column(name = "category_type", nullable = false, length = 20)
    private KakeiboGroup group;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Generated
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Generated
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Category() {
    }

    public Category(UUID userId, String name, String slug, KakeiboGroup group) {
        this.userId = userId;
        this.name = name;
        this.slug = slug;
        this.group = group;
        this.active = true;
    }

    public boolean isDefault() {
        return userId == null;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public KakeiboGroup getGroup() {
        return group;
    }

    public void setGroup(KakeiboGroup group) {
        this.group = group;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
