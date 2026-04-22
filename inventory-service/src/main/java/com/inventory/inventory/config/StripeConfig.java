package com.inventory.inventory.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Inicializa el SDK global de Stripe con la API key configurada.
 * Fase 2b.
 */
@Configuration
@EnableConfigurationProperties(StripeProperties.class)
public class StripeConfig {

    private static final Logger log = LoggerFactory.getLogger(StripeConfig.class);

    private final StripeProperties props;

    public StripeConfig(StripeProperties props) {
        this.props = props;
    }

    @PostConstruct
    void init() {
        if (props.getSecretKey() == null || props.getSecretKey().isBlank()) {
            log.warn("STRIPE_SECRET_KEY sin configurar: los endpoints de pago responderan 503 hasta que se defina");
            return;
        }
        Stripe.apiKey = props.getSecretKey();
        log.info("Stripe SDK inicializado (moneda={}, success_url={})",
                props.getCurrency(), props.getSuccessUrl());
    }
}
