package com.inventory.ai.service;

import com.inventory.ai.dto.DesignSpec;
import com.inventory.ai.dto.PriceBreakdown;
import com.inventory.ai.config.PricingRulesProperties;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class PricingService {

    private final PricingRulesProperties rules;

    public PricingService(PricingRulesProperties rules) {
        this.rules = rules;
    }

    public DesignSpec applyPricing(DesignSpec spec) {
        BigDecimal basePrice = basePriceFor(spec.productType());
        BigDecimal materialCost = materialCostFor(spec.primaryMaterial(), spec.secondaryMaterials());
        BigDecimal complexityCost = complexityCostFor(spec.complexity());
        BigDecimal sizeCost = sizeCostFor(spec.dimensions());
        BigDecimal finishCost = finishCostFor(spec.finish());
        BigDecimal total = roundToThousand(basePrice
                .add(materialCost)
                .add(complexityCost)
                .add(sizeCost)
                .add(finishCost));
        Integer estimatedDays = estimatedDaysFor(spec.productType(), spec.complexity(), spec.dimensions());

        PriceBreakdown breakdown = new PriceBreakdown(
                basePrice,
                materialCost,
                complexityCost,
                sizeCost,
                finishCost,
                total,
                pricingNotes(spec, estimatedDays)
        );

        return new DesignSpec(
                spec.productType(),
                spec.title(),
                spec.artisanStory(),
                spec.territory(),
                spec.primaryMaterial(),
                spec.secondaryMaterials(),
                spec.colorPalette(),
                spec.dimensions(),
                spec.pattern(),
                spec.finish(),
                normalizeComplexity(spec.complexity()),
                total,
                breakdown,
                estimatedDays,
                spec.makingSteps(),
                spec.threeD()
        );
    }

    private BigDecimal basePriceFor(String productType) {
        BigDecimal configured = configuredAmount(rules.basePrices(), key(productType));
        if (configured != null) return configured;
        return switch (key(productType)) {
            case "lamp", "lampara" -> BigDecimal.valueOf(90000);
            case "basket", "canasto", "cesto" -> BigDecimal.valueOf(60000);
            case "planter", "matera" -> BigDecimal.valueOf(65000);
            case "jewelry", "joya", "collar", "arete" -> BigDecimal.valueOf(45000);
            case "tray", "bandeja" -> BigDecimal.valueOf(55000);
            case "clock", "reloj" -> BigDecimal.valueOf(80000);
            case "mural", "centerpiece", "centro de mesa" -> BigDecimal.valueOf(100000);
            default -> BigDecimal.valueOf(70000);
        };
    }

    private BigDecimal materialCostFor(String primaryMaterial, List<String> secondaryMaterials) {
        BigDecimal total = materialCost(primaryMaterial);
        if (secondaryMaterials != null) {
            for (String material : secondaryMaterials) {
                total = total.add(materialCost(material).multiply(factor(rules.secondaryMaterialFactor(), BigDecimal.valueOf(0.35))));
            }
        }
        return roundToThousand(total);
    }

    private BigDecimal materialCost(String material) {
        String value = key(material);
        BigDecimal configured = configuredAmountContaining(rules.materialCosts(), value);
        if (configured != null) return configured;
        if (value.contains("guadua")) return BigDecimal.valueOf(45000);
        if (value.contains("barro")) return BigDecimal.valueOf(35000);
        if (value.contains("ceramica")) return BigDecimal.valueOf(50000);
        if (value.contains("fique")) return BigDecimal.valueOf(30000);
        if (value.contains("iraca")) return BigDecimal.valueOf(35000);
        if (value.contains("madera")) return BigDecimal.valueOf(55000);
        if (value.contains("lana")) return BigDecimal.valueOf(45000);
        if (value.contains("filamento") || value.contains("dorado")) return BigDecimal.valueOf(25000);
        return BigDecimal.valueOf(25000);
    }

    private BigDecimal complexityCostFor(String complexity) {
        BigDecimal configured = configuredAmount(rules.complexityCosts(), normalizeComplexity(complexity));
        if (configured != null) return configured;
        return switch (normalizeComplexity(complexity)) {
            case "baja" -> BigDecimal.valueOf(20000);
            case "alta" -> BigDecimal.valueOf(120000);
            default -> BigDecimal.valueOf(60000);
        };
    }

    private BigDecimal sizeCostFor(DesignSpec.Dimensions dimensions) {
        if (dimensions == null) return BigDecimal.valueOf(20000);
        int height = safe(dimensions.heightCm());
        int width = safe(dimensions.widthCm());
        int depth = safe(dimensions.depthCm());
        int diameter = safe(dimensions.diameterCm());
        int footprint = Math.max(width, diameter) + Math.max(depth, diameter);
        int sizeScore = Math.max(20, height + footprint);
        return BigDecimal.valueOf(sizeScore)
                .multiply(factor(rules.sizeMultiplier(), BigDecimal.valueOf(900)))
                .min(factor(rules.maxSizeCost(), BigDecimal.valueOf(95000)));
    }

    private BigDecimal finishCostFor(String finish) {
        String value = key(finish);
        BigDecimal configured = configuredAmountContaining(rules.finishCosts(), value);
        if (configured != null) return configured;
        if (value.contains("dorado") || value.contains("metal")) return BigDecimal.valueOf(35000);
        if (value.contains("tallado") || value.contains("relieve")) return BigDecimal.valueOf(45000);
        if (value.contains("brillante") || value.contains("esmalt")) return BigDecimal.valueOf(25000);
        if (value.contains("mate")) return BigDecimal.valueOf(15000);
        return BigDecimal.valueOf(18000);
    }

    private Integer estimatedDaysFor(String productType, String complexity, DesignSpec.Dimensions dimensions) {
        int days = switch (key(productType)) {
            case "jewelry", "joya", "collar", "arete" -> 6;
            case "clock", "reloj" -> 10;
            case "lamp", "lampara", "mural", "centerpiece", "centro de mesa" -> 12;
            default -> 9;
        };
        days += switch (normalizeComplexity(complexity)) {
            case "baja" -> 1;
            case "alta" -> 8;
            default -> 4;
        };
        if (dimensions != null && safe(dimensions.heightCm()) > 45) {
            days += 3;
        }
        return days;
    }

    private List<String> pricingNotes(DesignSpec spec, Integer estimatedDays) {
        List<String> notes = new ArrayList<>();
        notes.add("Precio estimado para cotizacion inicial; el taller valida disponibilidad y tecnica antes de confirmar.");
        notes.add("Incluye material principal, materiales secundarios, acabado, talla y complejidad de fabricacion.");
        notes.add("Tiempo estimado de taller: " + estimatedDays + " dias calendario.");
        if ("alta".equals(normalizeComplexity(spec.complexity()))) {
            notes.add("La complejidad alta contempla mas iteraciones de patron, union o acabado manual.");
        }
        return notes;
    }

    private BigDecimal roundToThousand(BigDecimal value) {
        return value.divide(BigDecimal.valueOf(1000), 0, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(1000));
    }

    private int safe(Integer value) {
        return value == null ? 0 : Math.max(0, value);
    }

    private String normalizeComplexity(String complexity) {
        String value = key(complexity);
        if (value.contains("alta") || value.contains("complej")) return "alta";
        if (value.contains("baja") || value.contains("simple")) return "baja";
        return "media";
    }

    private String key(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .trim();
    }

    private BigDecimal configuredAmount(Map<String, BigDecimal> values, String lookup) {
        if (values == null || values.isEmpty()) return null;
        return values.get(lookup);
    }

    private BigDecimal configuredAmountContaining(Map<String, BigDecimal> values, String lookup) {
        if (values == null || values.isEmpty()) return null;
        for (Map.Entry<String, BigDecimal> entry : values.entrySet()) {
            if (lookup.contains(key(entry.getKey()))) {
                return entry.getValue();
            }
        }
        return null;
    }

    private BigDecimal factor(BigDecimal configured, BigDecimal fallback) {
        return configured == null ? fallback : configured;
    }
}
