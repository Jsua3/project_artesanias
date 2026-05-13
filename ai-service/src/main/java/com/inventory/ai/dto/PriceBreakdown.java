package com.inventory.ai.dto;

import java.math.BigDecimal;
import java.util.List;

public record PriceBreakdown(
        BigDecimal basePrice,
        BigDecimal materialCost,
        BigDecimal complexityCost,
        BigDecimal sizeCost,
        BigDecimal finishCost,
        BigDecimal total,
        List<String> pricingNotes
) {}
