package com.inventory.ai.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DesignNotificationResponse(
        UUID id,
        UUID userId,
        UUID designId,
        String title,
        String message,
        String status,
        boolean read,
        LocalDateTime readAt,
        LocalDateTime createdAt
) {}
