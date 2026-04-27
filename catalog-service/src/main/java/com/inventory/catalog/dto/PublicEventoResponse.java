package com.inventory.catalog.dto;

import java.time.LocalDate;
import java.util.UUID;

public record PublicEventoResponse(
        UUID id,
        String titulo,
        String descripcion,
        LocalDate fecha,
        String ubicacion,
        String imagenUrl,
        String artesanoNombre
) {}
