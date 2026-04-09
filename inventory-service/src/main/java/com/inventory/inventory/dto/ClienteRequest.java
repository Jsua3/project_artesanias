package com.inventory.inventory.dto;

public record ClienteRequest(
    String nombre,
    String telefono,
    String email,
    String direccion
) {}
