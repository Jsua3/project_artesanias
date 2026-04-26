package com.inventory.auth.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Registro público de clientes finales del marketplace.
 * <p>
 * A diferencia de {@link RegisterRequest}, este DTO NO acepta el campo
 * {@code role}: el endpoint asociado siempre asigna {@code UserRole.CLIENTE},
 * mitigando el riesgo de Mass Assignment en el flujo público.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record RegisterClienteRequest(
        @JsonProperty("username") String username,
        @JsonProperty("password") String password,
        @JsonProperty("displayName") String displayName
) {
    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public RegisterClienteRequest {
    }
}
