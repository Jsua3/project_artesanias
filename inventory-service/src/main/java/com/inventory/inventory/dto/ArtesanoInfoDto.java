package com.inventory.inventory.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.UUID;

/**
 * Proyeccion minima del ArtesanoResponse de catalog-service (Fase 2c).
 * Usado para resolver user_account_id del MAESTRO -> artesano_id.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ArtesanoInfoDto(
    UUID id,
    String nombre,
    UUID userAccountId,
    Boolean active
) {}
