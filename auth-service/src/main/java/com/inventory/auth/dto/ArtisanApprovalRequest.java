package com.inventory.auth.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ArtisanApprovalRequest(
        @JsonProperty("decision") String decision
) {
    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public ArtisanApprovalRequest {
    }
}
