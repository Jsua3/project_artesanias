package com.inventory.gateway.dto;

import java.util.Map;

public record IntegrationStatusResponse(
        String name,
        boolean configured,
        String status,
        String detail,
        Map<String, Object> metadata
) {
}
