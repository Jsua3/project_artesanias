package com.inventory.ai.dto;

public record DesignTurnResponse(
        String reply,
        DesignSpec spec,
        String previewPrompt,
        String source
) {}
