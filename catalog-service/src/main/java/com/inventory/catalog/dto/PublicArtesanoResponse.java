package com.inventory.catalog.dto;

import java.util.UUID;

public record PublicArtesanoResponse(
        UUID id,
        String nombre,
        String especialidad,
        String ubicacion,
        String imageUrl
) {}
