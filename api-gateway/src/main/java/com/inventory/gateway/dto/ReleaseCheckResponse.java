package com.inventory.gateway.dto;

public record ReleaseCheckResponse(
        String id,
        String label,
        String status,
        String detail
) {
}
