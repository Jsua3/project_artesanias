package com.inventory.inventory.dto;

import java.util.List;
import java.util.UUID;

public record VentaRequest(
    UUID clienteId,
    List<VentaItemRequest> items
) {}
