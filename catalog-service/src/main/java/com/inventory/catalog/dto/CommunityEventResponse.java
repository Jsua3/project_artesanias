package com.inventory.catalog.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record CommunityEventResponse(
        UUID id,
        UUID artesanoId,
        String artesanoNombre,
        String organizacion,
        String nombre,
        String localidad,
        String direccionExacta,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        String hora,
        String descripcion,
        String estado,
        String reviewComment,
        LocalDateTime createdAt
) {
}
