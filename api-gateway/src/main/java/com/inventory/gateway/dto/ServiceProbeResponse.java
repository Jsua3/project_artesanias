package com.inventory.gateway.dto;

import java.time.Instant;

public record ServiceProbeResponse(
        String name,
        String kind,
        String url,
        String status,
        Integer httpStatus,
        long responseTimeMs,
        Instant checkedAt,
        String message
) {
}
