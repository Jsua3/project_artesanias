package com.inventory.auth.dto;

public record ProfileUpdateRequest(
        String displayName,
        String avatarUrl,
        String firstName,
        String lastName,
        String phone,
        String bio,
        String locality,
        String craftType,
        String address
) {
}
