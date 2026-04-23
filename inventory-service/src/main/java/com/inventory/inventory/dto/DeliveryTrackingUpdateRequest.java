package com.inventory.inventory.dto;

public record DeliveryTrackingUpdateRequest(
        Boolean packed,
        Boolean pickedUp,
        Boolean onTheWay,
        Boolean delivered
) {
}
