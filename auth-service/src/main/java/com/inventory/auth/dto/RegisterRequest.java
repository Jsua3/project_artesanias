package com.inventory.auth.dto;

public record RegisterRequest(
        String username,
        String password,
        String role,
        String courierMode,
        String courierCompany
) {
}
