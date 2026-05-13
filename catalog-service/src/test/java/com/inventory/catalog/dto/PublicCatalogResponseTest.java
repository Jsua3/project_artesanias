package com.inventory.catalog.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PublicCatalogResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void publicProductResponseDoesNotSerializeInternalInventoryFields() throws Exception {
        PublicProductResponse response = new PublicProductResponse(
                UUID.randomUUID(),
                "Canasto",
                "Tejido a mano",
                new BigDecimal("45000"),
                "/images/canasto.jpg",
                UUID.randomUUID(),
                List.of(UUID.randomUUID()),
                UUID.randomUUID()
        );

        JsonNode json = objectMapper.valueToTree(response);

        assertThat(json.has("sku")).isFalse();
        assertThat(json.has("stockMinimo")).isFalse();
        assertThat(json.has("active")).isFalse();
        assertThat(json.has("createdAt")).isFalse();
        assertThat(json.has("updatedAt")).isFalse();
    }

    @Test
    void publicArtesanoResponseDoesNotSerializePrivateContactOrAccountFields() {
        PublicArtesanoResponse response = new PublicArtesanoResponse(
                UUID.randomUUID(),
                "Doña Elvira",
                "Cestería",
                "Filandia",
                "/images/elvira.jpg"
        );

        JsonNode json = objectMapper.valueToTree(response);

        assertThat(json.has("telefono")).isFalse();
        assertThat(json.has("email")).isFalse();
        assertThat(json.has("userAccountId")).isFalse();
        assertThat(json.has("active")).isFalse();
        assertThat(json.has("createdAt")).isFalse();
    }
}
