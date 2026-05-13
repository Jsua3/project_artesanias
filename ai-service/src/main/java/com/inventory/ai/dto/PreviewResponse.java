package com.inventory.ai.dto;

public record PreviewResponse(
        String imageBase64,
        String mimeType,
        String prompt,
        String source
) {}
