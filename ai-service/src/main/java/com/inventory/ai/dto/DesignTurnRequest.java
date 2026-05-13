package com.inventory.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DesignTurnRequest(
        @NotBlank @Size(min = 8, max = 1500)
        String message,
        DesignSpec currentSpec
) {}
