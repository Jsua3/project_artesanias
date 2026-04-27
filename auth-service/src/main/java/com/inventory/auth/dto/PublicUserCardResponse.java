package com.inventory.auth.dto;

import java.util.UUID;

public record PublicUserCardResponse(UUID id, String displayName, String avatarUrl, String phone) {}
