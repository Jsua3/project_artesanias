package com.inventory.inventory.dto;

import java.util.UUID;

public record CourierCardDto(
        UUID id,
        String displayName,
        String avatarUrl,
        String phone
) {}
