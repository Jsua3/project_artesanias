package com.inventory.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateDesignStatusRequest(
        @NotBlank
        String status,
        @Size(max = 800)
        String reviewNotes
) {}
