package com.inventory.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.ai.config.OpenAiProperties;
import com.inventory.ai.config.PricingRulesProperties;
import com.inventory.ai.dto.DesignTurnRequest;
import com.inventory.ai.repository.CustomDesignNotificationRepository;
import com.inventory.ai.repository.CustomDesignRequestRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class DesignAgentServiceTest {

    @Test
    void fallbackCreatesStructuredArtisanDesignWhenOpenAiKeyIsMissing() {
        DesignAgentService service = new DesignAgentService(
                WebClient.builder().baseUrl("http://localhost").build(),
                new OpenAiProperties("", "gpt-5-mini", "gpt-image-1", "https://api.openai.com/v1"),
                new ObjectMapper(),
                new PricingService(new PricingRulesProperties(null, null, null, null, null, null, null)),
                mock(CustomDesignRequestRepository.class),
                mock(CustomDesignNotificationRepository.class)
        );

        StepVerifier.create(service.nextTurn("user-1", new DesignTurnRequest(
                "Quiero una lampara de guadua para sala con patron de cafetal",
                null
        )))
                .assertNext(response -> {
                    assertThat(response.reply()).containsIgnoringCase("lampara");
                    assertThat(response.spec().productType()).isEqualTo("lamp");
                    assertThat(response.spec().primaryMaterial()).isEqualTo("guadua");
                    assertThat(response.spec().priceBreakdown()).isNotNull();
                    assertThat(response.spec().priceBreakdown().total()).isEqualByComparingTo(response.spec().estimatedPrice());
                    assertThat(response.spec().estimatedDays()).isGreaterThan(0);
                    assertThat(response.spec().threeD().template()).isEqualTo("lamp");
                    assertThat(response.previewPrompt()).contains("Product design render");
                    assertThat(response.source()).isEqualTo("fallback");
                })
                .verifyComplete();
    }

    @Test
    void fallbackKeepsRequestedMaterialColorsAndPattern() {
        DesignAgentService service = new DesignAgentService(
                WebClient.builder().baseUrl("http://localhost").build(),
                new OpenAiProperties("", "gpt-5-mini", "gpt-image-1", "https://api.openai.com/v1"),
                new ObjectMapper(),
                new PricingService(new PricingRulesProperties(null, null, null, null, null, null, null)),
                mock(CustomDesignRequestRepository.class),
                mock(CustomDesignNotificationRepository.class)
        );

        StepVerifier.create(service.nextTurn("public", new DesignTurnRequest(
                "Quiero una lampara de bejuco color azul, con detalles circulares en rojo y maximo 35 cm",
                null
        )))
                .assertNext(response -> {
                    assertThat(response.reply()).containsIgnoringCase("bejuco");
                    assertThat(response.reply()).containsIgnoringCase("azul");
                    assertThat(response.reply()).containsIgnoringCase("rojo");
                    assertThat(response.spec().productType()).isEqualTo("lamp");
                    assertThat(response.spec().primaryMaterial()).isEqualTo("bejuco");
                    assertThat(response.spec().pattern()).isEqualTo("aros_circulares");
                    assertThat(response.spec().colorPalette()).contains("#2F5F8F", "#B84A3A");
                    assertThat(response.spec().dimensions().heightCm()).isEqualTo(35);
                    assertThat(response.spec().threeD().materialColor()).isEqualTo("#2F5F8F");
                    assertThat(response.spec().threeD().accentColor()).isEqualTo("#B84A3A");
                })
                .verifyComplete();
    }
}
