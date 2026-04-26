package com.inventory.auth.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LoginRequest(
        @JsonProperty("username") String username,
        @JsonProperty("password") String password
) {
    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public LoginRequest {
    }
}
