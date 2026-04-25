package com.inventory.auth.dto;

import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String username,
        String role,
        String approvalStatus,
        String courierMode,
        String courierCompany,
        String displayName,
        String avatarUrl,
        String firstName,
        String lastName,
        String phone,
        String bio,
        String locality,
        String craftType,
        String address,
        Integer profileCompletion,
        Boolean profileComplete,
        java.time.LocalDateTime createdAt,
        java.time.LocalDateTime approvedAt
) {
}
