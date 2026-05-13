package com.inventory.gateway.dto;

import java.time.Instant;
import java.util.List;

public record SystemHealthResponse(
        String overallStatus,
        Instant generatedAt,
        String gatewayVersion,
        List<ServiceProbeResponse> services,
        List<IntegrationStatusResponse> integrations,
        List<ReleaseCheckResponse> releaseChecklist
) {
}
