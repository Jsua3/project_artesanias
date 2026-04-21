package com.inventory.auth.dto;

/**
 * Registro público de clientes finales del marketplace.
 * <p>
 * A diferencia de {@link RegisterRequest}, este DTO NO acepta el campo
 * {@code role}: el endpoint asociado siempre asigna {@code UserRole.CLIENTE},
 * mitigando el riesgo de Mass Assignment en el flujo público.
 */
public record RegisterClienteRequest(
        String username,
        String password,
        String displayName
) {
}
