package com.inventory.inventory.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ClienteResponse(
    UUID id,
    String nombre,
    String telefono,
    String email,
    String direccion,
    LocalDateTime createdAt
) {}
