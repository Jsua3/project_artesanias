package com.inventory.auth.dto;

import java.util.UUID;

public record SyncArtesanoRequest(
        UUID userAccountId,
        String nombre,
        String email,
        String especialidad,
        String ubicacion,
        String avatarUrl
) {}
