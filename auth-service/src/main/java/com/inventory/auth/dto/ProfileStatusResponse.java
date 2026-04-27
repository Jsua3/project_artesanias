package com.inventory.auth.dto;

import java.util.List;

public record ProfileStatusResponse(boolean profileComplete, List<String> missingFields) {}
