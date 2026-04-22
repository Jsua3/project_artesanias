package com.inventory.inventory.service;

import com.inventory.inventory.config.StripeProperties;
import com.inventory.inventory.model.Venta;
import com.inventory.inventory.model.VentaDetalle;
import com.inventory.inventory.repository.VentaDetalleRepository;
import com.inventory.inventory.repository.VentaRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

/**
 * Fase 2b: integracion con Stripe Checkout (hosted page).
 *
 * - createCheckoutSession: crea una Stripe Checkout Session para una Venta
 *   PENDIENTE y guarda el session id en la columna ventas.stripe_session_id.
 * - verifyWebhookSignature: valida la firma del webhook usando el secret
 *   compartido; si es invalida, tira una excepcion.
 * - El traspaso a PAGADA + descuento de stock lo hace VentaService.markAsPaid
 *   cuando el webhook llega con checkout.session.completed.
 */
@Service
public class StripeService {

    private static final Logger log = LoggerFactory.getLogger(StripeService.class);

    private final StripeProperties props;
    private final VentaRepository ventaRepository;
    private final VentaDetalleRepository ventaDetalleRepository;

    public StripeService(StripeProperties props,
                         VentaRepository ventaRepository,
                         VentaDetalleRepository ventaDetalleRepository) {
        this.props = props;
        this.ventaRepository = ventaRepository;
        this.ventaDetalleRepository = ventaDetalleRepository;
    }

    /** true si el servicio esta configurado; si no, los endpoints deben responder 503. */
    public boolean isConfigured() {
        return props.getSecretKey() != null && !props.getSecretKey().isBlank();
    }

    /**
     * Crea una Stripe Checkout Session para la Venta dada. Retorna la URL
     * hosted a la que el frontend debe redirigir al cliente.
     */
    public Mono<CheckoutSessionResult> createCheckoutSession(Venta venta) {
        if (!isConfigured()) {
            return Mono.error(new IllegalStateException("Stripe no esta configurado"));
        }
        if (!"PENDIENTE".equals(venta.estado())) {
            return Mono.error(new IllegalStateException(
                    "Solo se puede pagar una venta en estado PENDIENTE (estado actual: " + venta.estado() + ")"));
        }

        return ventaDetalleRepository.findByVentaId(venta.id())
                .collectList()
                .flatMap(detalles -> {
                    if (detalles.isEmpty()) {
                        return Mono.error(new IllegalStateException("La venta no tiene items"));
                    }
                    try {
                        Session session = buildAndCreateSession(venta, detalles);
                        Venta updated = copyWithSessionId(venta, session.getId());
                        return ventaRepository.save(updated)
                                .thenReturn(new CheckoutSessionResult(session.getId(), session.getUrl()));
                    } catch (StripeException e) {
                        log.error("Stripe rechazo createSession para venta {}: {}", venta.id(), e.getMessage());
                        return Mono.error(e);
                    }
                });
    }

    private Session buildAndCreateSession(Venta venta, List<VentaDetalle> detalles) throws StripeException {
        SessionCreateParams.Builder b = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(resolveSuccessUrl(venta.id()))
                .setCancelUrl(props.getCancelUrl())
                .putMetadata("ventaId", venta.id().toString())
                .setClientReferenceId(venta.id().toString());

        for (VentaDetalle d : detalles) {
            long unitAmount = toStripeAmount(d.precioUnitario());
            b.addLineItem(
                    SessionCreateParams.LineItem.builder()
                            .setQuantity((long) d.cantidad())
                            .setPriceData(
                                    SessionCreateParams.LineItem.PriceData.builder()
                                            .setCurrency(props.getCurrency())
                                            .setUnitAmount(unitAmount)
                                            .setProductData(
                                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                            .setName("Pieza " + d.productId().toString().substring(0, 8))
                                                            .build()
                                            )
                                            .build()
                            )
                            .build()
            );
        }
        return Session.create(b.build());
    }

    private String resolveSuccessUrl(UUID ventaId) {
        String raw = props.getSuccessUrl() == null ? "" : props.getSuccessUrl();
        // Reemplazo de placeholder + append del session_id que Stripe pide
        String withVenta = raw.replace("{ventaId}", ventaId.toString());
        String sep = withVenta.contains("?") ? "&" : "?";
        return withVenta + sep + "session_id={CHECKOUT_SESSION_ID}";
    }

    /**
     * Convierte un monto en BigDecimal a la unidad minima que Stripe espera.
     * Para monedas zero-decimal (COP, JPY, etc.) es la cantidad entera;
     * para el resto se multiplica por 100.
     */
    long toStripeAmount(BigDecimal amount) {
        if (amount == null) return 0L;
        if (props.isZeroDecimalCurrency()) {
            return amount.setScale(0, RoundingMode.HALF_UP).longValueExact();
        }
        return amount.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    private Venta copyWithSessionId(Venta v, String sessionId) {
        Venta copy = new Venta(v.id(), v.clienteId(), v.vendedorId(),
                v.total(), v.estado(), v.createdAt(), sessionId);
        // No es insert: es update.
        return copy.withIsNew(false);
    }

    /**
     * Verifica la firma del webhook con el secret configurado. Si la firma
     * es invalida tira SignatureVerificationException -> 400 al controller.
     */
    public com.stripe.model.Event parseAndVerifyWebhook(String payload, String signatureHeader) throws Exception {
        if (props.getWebhookSecret() == null || props.getWebhookSecret().isBlank()) {
            throw new IllegalStateException("STRIPE_WEBHOOK_SECRET no configurado");
        }
        return Webhook.constructEvent(payload, signatureHeader, props.getWebhookSecret());
    }

    /** DTO simple para devolver el resultado al controller. */
    public record CheckoutSessionResult(String sessionId, String url) {}
}
