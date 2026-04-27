package com.inventory.inventory.dto;

public record ShippingInfoDto(
        String recipientName,
        String recipientPhone,
        String address,
        String city,
        String notes
) {}
