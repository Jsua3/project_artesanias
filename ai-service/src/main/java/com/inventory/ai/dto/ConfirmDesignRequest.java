package com.inventory.ai.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ConfirmDesignRequest(
        @NotNull
        DesignSpec spec,
        @Size(max = 800)
        String customerNotes,
        String previewPrompt,
        String previewImageBase64,
        String previewMimeType,
        String previewSource
) {}
