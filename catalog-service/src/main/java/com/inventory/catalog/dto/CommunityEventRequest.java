package com.inventory.catalog.dto;

import java.time.LocalDate;

public record CommunityEventRequest(
        String artesanoNombre,
        String organizacion,
        String nombre,
        String localidad,
        String direccionExacta,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        String hora,
        String descripcion
) {
}
