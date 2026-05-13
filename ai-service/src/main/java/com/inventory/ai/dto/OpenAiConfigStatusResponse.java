package com.inventory.ai.dto;

public record OpenAiConfigStatusResponse(
        boolean configured,
        String status,
        String detail,
        String model,
        String imageModel,
        boolean fallbackAvailable
) {
}
