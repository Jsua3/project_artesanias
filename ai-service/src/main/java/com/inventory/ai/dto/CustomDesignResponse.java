package com.inventory.ai.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record CustomDesignResponse(
        UUID id,
        UUID userId,
        String title,
        String productType,
        String status,
        DesignSpec spec,
        PriceBreakdown priceBreakdown,
        BigDecimal estimatedPrice,
        Integer estimatedDays,
        String customerNotes,
        String reviewNotes,
        String previewPrompt,
        String previewImageBase64,
        String previewMimeType,
        String previewSource,
        LocalDateTime createdAt
) {}
