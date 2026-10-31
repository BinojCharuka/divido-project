package com.divido.entity;

/**
 * Kakeibo budget groups.
 * In API and frontend documentation: NEEDS, WANTS, CULTURE, UNEXPECTED.
 * In V1 database CHECK constraint: NEED, WANT, CULTURE, UNEXPECTED.
 */
public enum KakeiboGroup {
    NEEDS("NEED"),
    WANTS("WANT"),
    CULTURE("CULTURE"),
    UNEXPECTED("UNEXPECTED");

    private final String dbValue;

    KakeiboGroup(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static KakeiboGroup fromDbValue(String dbValue) {
        if (dbValue == null) {
            return null;
        }
        for (KakeiboGroup group : values()) {
            if (group.dbValue.equalsIgnoreCase(dbValue) || group.name().equalsIgnoreCase(dbValue)) {
                return group;
            }
        }
        throw new IllegalArgumentException("Unknown database category_type: " + dbValue);
    }
}
