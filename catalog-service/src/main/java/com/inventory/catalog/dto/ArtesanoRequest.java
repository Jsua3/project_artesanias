package com.inventory.catalog.dto;

public record ArtesanoRequest(
    String nombre,
    String telefono,
    String email,
    String especialidad,
    String ubicacion,
    String imageUrl
) {}
