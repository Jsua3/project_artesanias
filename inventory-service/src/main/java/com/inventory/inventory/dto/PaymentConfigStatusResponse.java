package com.inventory.inventory.dto;

public record PaymentConfigStatusResponse(
        boolean configured,
        boolean webhookConfigured,
        String status,
        String detail,
        String currency,
        boolean successUrlConfigured,
        boolean cancelUrlConfigured
) {
}
