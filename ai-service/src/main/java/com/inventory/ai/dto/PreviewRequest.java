package com.inventory.ai.dto;

import jakarta.validation.constraints.NotNull;

public record PreviewRequest(
        @NotNull
        DesignSpec spec
) {}
