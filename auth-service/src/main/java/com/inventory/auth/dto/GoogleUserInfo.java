package com.inventory.auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GoogleUserInfo(
        String sub,
        String email,
        String name,
        String picture,
        String aud,
        @JsonProperty("email_verified") String emailVerified
) {}
