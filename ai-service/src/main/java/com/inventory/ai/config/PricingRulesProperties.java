package com.inventory.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;
import java.util.Map;

@ConfigurationProperties(prefix = "pricing.design")
public record PricingRulesProperties(
        Map<String, BigDecimal> basePrices,
        Map<String, BigDecimal> materialCosts,
        Map<String, BigDecimal> complexityCosts,
        Map<String, BigDecimal> finishCosts,
        BigDecimal secondaryMaterialFactor,
        BigDecimal sizeMultiplier,
        BigDecimal maxSizeCost
) {}
