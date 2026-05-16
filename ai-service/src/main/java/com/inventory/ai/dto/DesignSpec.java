package com.inventory.ai.dto;

import java.math.BigDecimal;
import java.util.List;

public record DesignSpec(
        String productType,
        String title,
        String artisanStory,
        String territory,
        String primaryMaterial,
        List<String> secondaryMaterials,
        List<String> colorPalette,
        Dimensions dimensions,
        String pattern,
        String finish,
        String complexity,
        BigDecimal estimatedPrice,
        PriceBreakdown priceBreakdown,
        Integer estimatedDays,
        List<String> makingSteps,
        ThreeDParameters threeD
) {
    public record Dimensions(
            Integer heightCm,
            Integer widthCm,
            Integer depthCm,
            Integer diameterCm
    ) {}

    public record ThreeDParameters(
            String template,
            Double height,
            Double radius,
            Double taper,
            Double curvature,
            String materialColor,
            String accentColor,
            String patternStyle,
            Integer repeatCount,
            String engineVersion,
            String materialPreset,
            String detailLevel,
            String cameraPreset,
            String surfaceTexture,
            String ornamentStyle,
            List<ThreeDPart> parts
    ) {}

    public record ThreeDPart(
            String kind,
            String placement,
            Integer repeatCount,
            String color,
            Double scale,
            Double rotation
    ) {}
}
