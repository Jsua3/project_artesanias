package com.inventory.inventory.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Proyeccion minima del ProductResponse de catalog-service.
 * JsonIgnoreProperties evita que agregar campos en catalog rompa deserializacion.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ProductInfoDto(
    UUID id,
    String name,
    BigDecimal price,
    UUID artesanoId
) {}
