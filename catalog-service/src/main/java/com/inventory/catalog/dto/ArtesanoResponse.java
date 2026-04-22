package com.inventory.catalog.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ArtesanoResponse(
    UUID id,
    String nombre,
    String telefono,
    String email,
    String especialidad,
    String ubicacion,
    String imageUrl,
    Boolean active,
    UUID userAccountId,
    LocalDateTime createdAt
) {}
