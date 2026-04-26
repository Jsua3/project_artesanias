package com.inventory.auth.dto;

import java.util.UUID;

public record AuthResponse(String accessToken, String refreshToken, String username, String role, UUID id) {
}
