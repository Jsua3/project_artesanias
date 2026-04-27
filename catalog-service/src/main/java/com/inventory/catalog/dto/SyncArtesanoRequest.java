package com.inventory.catalog.dto;

import java.util.UUID;

/** Solicitud interna desde auth-service para sincronizar artesano al aprobar un usuario. */
public record SyncArtesanoRequest(
        UUID userAccountId,
        String nombre,
        String email,
        String especialidad,
        String ubicacion,
        String avatarUrl
) {}
