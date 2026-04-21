package com.inventory.auth.dto;

import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String username,
        String role,
        String approvalStatus,
        String displayName,
        String avatarUrl,
        java.time.LocalDateTime createdAt,
        java.time.LocalDateTime approvedAt
) {
}
