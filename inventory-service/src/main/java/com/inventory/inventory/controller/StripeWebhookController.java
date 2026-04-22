package com.inventory.inventory.controller;

import com.inventory.inventory.service.StripeService;
import com.inventory.inventory.service.VentaService;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Fase 2b. Endpoint al que Stripe hace POST con eventos firmados cuando
 * pasa algo con nuestras Checkout Sessions (pago exitoso, expirada, etc).
 *
 * Seguridad:
 * - Es publico (no lleva JWT) — el gateway lo enruta sin JwtAuth.
 * - La autenticidad la da la firma HMAC-SHA256 en el header
 *   "Stripe-Signature" que validamos con STRIPE_WEBHOOK_SECRET.
 * - Si la firma no valida, respondemos 400 y Stripe reintenta.
 */
@RestController
@RequestMapping("/api/stripe")
public class StripeWebhookController {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookController.class);

    private final StripeService stripeService;
    private final VentaService ventaService;

    public StripeWebhookController(StripeService stripeService, VentaService ventaService) {
        this.stripeService = stripeService;
        this.ventaService = ventaService;
    }

    @PostMapping("/webhook")
    public Mono<ResponseEntity<String>> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String signature) {

        if (!stripeService.isConfigured()) {
            log.warn("Webhook de Stripe recibido pero Stripe no esta configurado");
            return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("Stripe not configured"));
        }
        if (signature == null || signature.isBlank()) {
            return Mono.just(ResponseEntity.badRequest().body("Missing Stripe-Signature"));
        }

        final Event event;
        try {
            event = stripeService.parseAndVerifyWebhook(payload, signature);
        } catch (Exception e) {
            log.warn("Firma de webhook invalida: {}", e.getMessage());
            return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature"));
        }

        log.info("Stripe webhook recibido: {} (id={})", event.getType(), event.getId());

        // Solo nos importa checkout.session.completed por ahora.
        if (!"checkout.session.completed".equals(event.getType())) {
            return Mono.just(ResponseEntity.ok("ignored"));
        }

        StripeObject obj = event.getDataObjectDeserializer().getObject().orElse(null);
        if (!(obj instanceof Session session)) {
            log.warn("checkout.session.completed sin objeto Session deserializable");
            return Mono.just(ResponseEntity.ok("no-session"));
        }

        // payment_status debe ser "paid" para realmente marcar PAGADA.
        if (!"paid".equalsIgnoreCase(session.getPaymentStatus())) {
            log.info("Session {} completada pero payment_status={}, ignorando",
                    session.getId(), session.getPaymentStatus());
            return Mono.just(ResponseEntity.ok("not-paid"));
        }

        UUID ventaId = extractVentaId(session);
        if (ventaId == null) {
            // Fallback: lookup por session_id persistido al crear la session.
            return ventaService.findByStripeSessionId(session.getId())
                    .flatMap(v -> ventaService.markAsPaid(v.id()))
                    .map(v -> ResponseEntity.ok("ok"))
                    .defaultIfEmpty(ResponseEntity.ok("venta-not-found"))
                    .onErrorResume(e -> {
                        log.error("Error aplicando pago webhook session {}: {}", session.getId(), e.getMessage(), e);
                        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error"));
                    });
        }
        return ventaService.markAsPaid(ventaId)
                .map(v -> ResponseEntity.ok("ok"))
                .onErrorResume(e -> {
                    log.error("Error aplicando pago webhook venta {}: {}", ventaId, e.getMessage(), e);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error"));
                });
    }

    /** ventaId viene en metadata y en client_reference_id. Se prueba primero metadata. */
    private UUID extractVentaId(Session session) {
        try {
            if (session.getMetadata() != null) {
                String raw = session.getMetadata().get("ventaId");
                if (raw != null && !raw.isBlank()) {
                    return UUID.fromString(raw);
                }
            }
            String ref = session.getClientReferenceId();
            if (ref != null && !ref.isBlank()) {
                return UUID.fromString(ref);
            }
        } catch (IllegalArgumentException ignore) {
            // UUID mal formado - caemos al fallback por session_id
        }
        return null;
    }
}
