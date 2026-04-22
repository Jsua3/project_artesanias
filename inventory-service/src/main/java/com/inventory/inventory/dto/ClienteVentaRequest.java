package com.inventory.inventory.dto;

import java.util.List;

/**
 * Request que hace un CLIENTE autenticado para crear una venta pendiente
 * (pre-pago). El cliente_id NO viene en el request: se deriva del usuario
 * autenticado (X-User-Id), creándolo si no existe. El displayName se usa
 * sólo como sugerencia la primera vez que se materializa el Cliente.
 */
public record ClienteVentaRequest(
        List<VentaItemRequest> items,
        String displayName
) {}
