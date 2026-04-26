package com.inventory.auth.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RegisterRequest(
        @JsonProperty("username") String username,
        @JsonProperty("password") String password,
        @JsonProperty("role") String role,
        @JsonProperty("courierMode") String courierMode,
        @JsonProperty("courierCompany") String courierCompany,
        @JsonProperty("displayName") String displayName
) {
    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public RegisterRequest {
    }
}
