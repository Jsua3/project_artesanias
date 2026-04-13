package com.inventory.auth.dto;

import java.util.UUID;

public record UserProfileResponse(UUID id, String username, String role, String displayName, String avatarUrl) {
}
