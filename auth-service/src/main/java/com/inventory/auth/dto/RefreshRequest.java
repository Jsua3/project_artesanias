package com.inventory.auth.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RefreshRequest(
        @JsonProperty("refreshToken") String refreshToken
) {
    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public RefreshRequest {
    }
}
