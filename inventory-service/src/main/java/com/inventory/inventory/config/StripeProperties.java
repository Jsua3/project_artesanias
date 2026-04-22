package com.inventory.inventory.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuracion de Stripe inyectada desde env vars / application.yml.
 * Fase 2b: cobro con Stripe Checkout Session (hosted).
 *
 * Env vars:
 *   STRIPE_SECRET_KEY       - sk_test_... o sk_live_...
 *   STRIPE_WEBHOOK_SECRET   - whsec_...
 *   STRIPE_SUCCESS_URL      - ej: https://tienda.com/mis-pedidos/{ventaId}?paid=1
 *   STRIPE_CANCEL_URL       - ej: https://tienda.com/checkout?canceled=1
 *   STRIPE_CURRENCY         - cop (zero-decimal en Stripe para COP)
 */
@ConfigurationProperties(prefix = "stripe")
public class StripeProperties {

    private String secretKey = "";
    private String webhookSecret = "";
    private String successUrl = "http://localhost:4200/mis-pedidos/{ventaId}?paid=1";
    private String cancelUrl = "http://localhost:4200/checkout?canceled=1";
    private String currency = "cop";

    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }

    public String getWebhookSecret() { return webhookSecret; }
    public void setWebhookSecret(String webhookSecret) { this.webhookSecret = webhookSecret; }

    public String getSuccessUrl() { return successUrl; }
    public void setSuccessUrl(String successUrl) { this.successUrl = successUrl; }

    public String getCancelUrl() { return cancelUrl; }
    public void setCancelUrl(String cancelUrl) { this.cancelUrl = cancelUrl; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    /**
     * Algunas monedas son "zero-decimal" en Stripe (el amount se manda en
     * unidades enteras en vez de centavos). COP es una de ellas.
     * Referencia: https://docs.stripe.com/currencies#zero-decimal
     */
    public boolean isZeroDecimalCurrency() {
        if (currency == null) return false;
        String c = currency.toLowerCase();
        return c.equals("cop") || c.equals("jpy") || c.equals("krw")
                || c.equals("clp") || c.equals("pyg") || c.equals("isk")
                || c.equals("vnd") || c.equals("rwf") || c.equals("bif")
                || c.equals("djf") || c.equals("gnf") || c.equals("kmf")
                || c.equals("mga") || c.equals("ugx") || c.equals("vuv")
                || c.equals("xaf") || c.equals("xof") || c.equals("xpf");
    }
}
