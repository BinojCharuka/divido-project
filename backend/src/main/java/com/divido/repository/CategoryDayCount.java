package com.divido.repository;

import com.divido.entity.KakeiboGroup;

import java.time.LocalDate;
import java.util.UUID;

/** Number of expenses a user recorded in one category on one date. */
public record CategoryDayCount(UUID categoryId, String categoryName, KakeiboGroup group, LocalDate date, long count) {
}
