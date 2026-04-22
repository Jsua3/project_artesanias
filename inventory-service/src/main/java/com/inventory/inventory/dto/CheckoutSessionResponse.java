package com.inventory.inventory.dto;

/**
 * Fase 2b. Devuelto por POST /api/cliente-ventas/{id}/checkout-session.
 * El frontend debe hacer window.location.href = url para mandar al cliente
 * a la pagina hosted de Stripe.
 */
public record CheckoutSessionResponse(String sessionId, String url) {}
