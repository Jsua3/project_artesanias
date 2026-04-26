package com.inventory.auth.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProfileUpdateRequest(
        @JsonProperty("displayName") String displayName,
        @JsonProperty("avatarUrl") String avatarUrl,
        @JsonProperty("firstName") String firstName,
        @JsonProperty("lastName") String lastName,
        @JsonProperty("phone") String phone,
        @JsonProperty("bio") String bio,
        @JsonProperty("locality") String locality,
        @JsonProperty("craftType") String craftType,
        @JsonProperty("address") String address
) {
    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public ProfileUpdateRequest {
    }
}
