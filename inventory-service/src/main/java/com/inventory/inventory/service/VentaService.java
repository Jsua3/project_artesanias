package com.inventory.inventory.service;

import com.inventory.inventory.dto.*;
import com.inventory.inventory.model.Cliente;
import com.inventory.inventory.model.Venta;
import com.inventory.inventory.model.VentaDetalle;
import com.inventory.inventory.repository.ClienteRepository;
import com.inventory.inventory.repository.VentaRepository;
import com.inventory.inventory.repository.VentaDetalleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VentaService {

    private final VentaRepository ventaRepository;
    private final VentaDetalleRepository ventaDetalleRepository;
    private final ClienteRepository clienteRepository;
    private final WebClient catalogWebClient;
    private final ExitService exitService;

    public VentaService(VentaRepository ventaRepository,
                       VentaDetalleRepository ventaDetalleRepository,
                       ClienteRepository clienteRepository,
                       WebClient catalogWebClient,
                       ExitService exitService) {
        this.ventaRepository = ventaRepository;
        this.ventaDetalleRepository = ventaDetalleRepository;
        this.clienteRepository = clienteRepository;
        this.catalogWebClient = catalogWebClient;
        this.exitService = exitService;
    }

    @Transactional
    public Mono<VentaResponse> createVenta(VentaRequest request, UUID vendedorId) {
        UUID ventaId = UUID.randomUUID();

        return Flux.fromIterable(request.items())
                .flatMap(item -> fetchProductInfo(item.productId())
                        .map(info -> new VentaDetalle(
                                UUID.randomUUID(),
                                ventaId,
                                item.productId(),
                                item.cantidad(),
                                info.price(),
                                info.price().multiply(BigDecimal.valueOf(item.cantidad())),
                                info.artesanoId()
                        ))
                )
                .collectList()
                .flatMap(detalles -> {
                    BigDecimal total = detalles.stream()
                            .map(VentaDetalle::subtotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    Venta venta = new Venta(ventaId, request.clienteId(), vendedorId,
                                           total, "COMPLETADA", LocalDateTime.now());

                    return ventaRepository.save(venta.withIsNew(true))
                            .flatMap(savedVenta ->
                                    Flux.fromIterable(detalles)
                                        .flatMap(d -> ventaDetalleRepository.save(d.withIsNew(true))
                                                .flatMap(savedD -> exitService.createExit(new ExitRequest(
                                                        d.productId(), d.cantidad(), "Venta directa " + ventaId),
                                                        vendedorId).thenReturn(savedD))
                                        )
                                        .collectList()
                            )
                            .map(savedDetalles -> toResponse(venta, savedDetalles));
                });
    }

    /**
     * Crea una venta en estado PENDIENTE para un CLIENTE autenticado (marketplace).
     * El precio se resuelve server-side contra catalog-service — nunca se confía
     * en un precio del cliente. El registro de Cliente se crea si no existe aún.
     */
    @Transactional
    public Mono<VentaResponse> createClienteVenta(ClienteVentaRequest request, UUID userAccountId, String displayNameFallback) {
        if (request.items() == null || request.items().isEmpty()) {
            return Mono.error(new IllegalArgumentException("La venta no puede estar vacía"));
        }
        if (request.items().stream().anyMatch(i -> i.cantidad() == null || i.cantidad() <= 0)) {
            return Mono.error(new IllegalArgumentException("Cantidad inválida en un item"));
        }

        String nameHint = (request.displayName() != null && !request.displayName().isBlank())
                ? request.displayName()
                : (displayNameFallback != null && !displayNameFallback.isBlank()
                    ? displayNameFallback
                    : "Cliente");

        UUID ventaId = UUID.randomUUID();

        return resolveClienteForUser(userAccountId, nameHint)
                .flatMap(cliente ->
                        Flux.fromIterable(request.items())
                                .flatMap(item -> fetchProductInfo(item.productId())
                                        .map(info -> new VentaDetalle(
                                                UUID.randomUUID(),
                                                ventaId,
                                                item.productId(),
                                                item.cantidad(),
                                                info.price(),
                                                info.price().multiply(BigDecimal.valueOf(item.cantidad())),
                                                info.artesanoId()
                                        ))
                                )
                                .collectList()
                                .flatMap(detalles -> {
                                    // Validar que todos los precios se resolvieron > 0
                                    boolean anyZero = detalles.stream()
                                            .anyMatch(d -> d.precioUnitario() == null
                                                    || d.precioUnitario().compareTo(BigDecimal.ZERO) <= 0);
                                    if (anyZero) {
                                        return Mono.error(new IllegalStateException(
                                                "No se pudo determinar el precio de uno o más productos"));
                                    }
                                    BigDecimal total = detalles.stream()
                                            .map(VentaDetalle::subtotal)
                                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                                    // El vendedorId para ventas de marketplace = el propio usuario (CLIENTE)
                                    // Estado = PENDIENTE hasta que Stripe confirme el pago (Fase 2b).
                                    Venta venta = new Venta(ventaId, cliente.id(), userAccountId,
                                                            total, "PENDIENTE", LocalDateTime.now());

                                    return ventaRepository.save(venta.withIsNew(true))
                                            .flatMap(savedVenta ->
                                                    Flux.fromIterable(detalles)
                                                        .flatMap(d -> ventaDetalleRepository.save(d.withIsNew(true)))
                                                        .collectList()
                                            )
                                            .map(savedDetalles -> toResponse(venta, savedDetalles));
                                })
                );
    }

    /**
     * Busca el Cliente asociado al usuario (FK user_account_id). Si no existe, lo crea.
     */
    public Mono<Cliente> resolveClienteForUser(UUID userAccountId, String displayName) {
        return clienteRepository.findByUserAccountId(userAccountId)
                .switchIfEmpty(Mono.defer(() -> {
                    Cliente nuevo = new Cliente(
                            UUID.randomUUID(),
                            displayName,
                            null, null, null,
                            userAccountId,
                            LocalDateTime.now()
                    );
                    return clienteRepository.save(nuevo.withIsNew(true));
                }));
    }

    public Flux<VentaResponse> getVentasByUserAccountId(UUID userAccountId) {
        return clienteRepository.findByUserAccountId(userAccountId)
                .flatMapMany(cliente -> ventaRepository.findByClienteId(cliente.id()))
                .flatMap(venta -> ventaDetalleRepository.findByVentaId(venta.id())
                        .collectList()
                        .map(detalles -> toResponse(venta, detalles)));
    }

    /**
     * Busca una venta por su stripe_session_id (para el webhook). Usado
     * como fallback cuando la metadata de la Session no trae ventaId.
     */
    public Mono<VentaResponse> findByStripeSessionId(String sessionId) {
        return ventaRepository.findByStripeSessionId(sessionId)
                .flatMap(venta -> ventaDetalleRepository.findByVentaId(venta.id())
                        .collectList()
                        .map(detalles -> toResponse(venta, detalles)));
    }

    /**
     * Fase 2b: mueve una venta PENDIENTE -> PAGADA y dispara el descuento
     * de stock via ExitService. Idempotente: si la venta ya esta PAGADA
     * no hace nada (asi reintentos del webhook no doblan la bajada de stock).
     */
    @Transactional
    public Mono<VentaResponse> markAsPaid(UUID ventaId) {
        return ventaRepository.findById(ventaId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Venta no encontrada: " + ventaId)))
                .flatMap(venta -> {
                    if ("PAGADA".equals(venta.estado()) || "COMPLETADA".equals(venta.estado())) {
                        // Idempotencia: no repetir descuento de stock
                        return ventaDetalleRepository.findByVentaId(venta.id())
                                .collectList()
                                .map(detalles -> toResponse(venta, detalles));
                    }
                    if (!"PENDIENTE".equals(venta.estado())) {
                        return Mono.error(new IllegalStateException(
                                "No se puede marcar como PAGADA una venta en estado " + venta.estado()));
                    }
                    venta.setEstado("PAGADA");
                    return ventaRepository.save(venta)
                            .then(ventaDetalleRepository.findByVentaId(venta.id()).collectList())
                            .flatMap(detalles ->
                                    Flux.fromIterable(detalles)
                                            .flatMap(d -> exitService.createExit(
                                                    new com.inventory.inventory.dto.ExitRequest(
                                                            d.productId(),
                                                            d.cantidad(),
                                                            "Pago Stripe venta " + venta.id()
                                                    ),
                                                    venta.vendedorId()
                                            ))
                                            .then(Mono.just(detalles))
                                            .map(list -> toResponse(venta, list))
                            );
                });
    }

    /** Verifica que una venta pertenece al user_account dado. */
    public Mono<Boolean> isVentaOwnedBy(UUID ventaId, UUID userAccountId) {
        return ventaRepository.findById(ventaId)
                .flatMap(venta -> clienteRepository.findById(venta.clienteId())
                        .map(c -> c.userAccountId() != null
                                && c.userAccountId().equals(userAccountId)))
                .defaultIfEmpty(false);
    }

    public Mono<VentaResponse> getVenta(UUID id) {
        return ventaRepository.findById(id)
                .zipWith(ventaDetalleRepository.findByVentaId(id).collectList())
                .map(tuple -> toResponse(tuple.getT1(), tuple.getT2()));
    }

    /** Lookup de la entidad Venta cruda (para StripeService que necesita el modelo). */
    public Mono<com.inventory.inventory.model.Venta> getVentaEntity(UUID id) {
        return ventaRepository.findById(id);
    }

    public Flux<VentaResponse> getAllVentas() {
        return ventaRepository.findAll()
                .flatMap(venta -> ventaDetalleRepository.findByVentaId(venta.id())
                        .collectList()
                        .map(detalles -> toResponse(venta, detalles)));
    }

    public Flux<VentaResponse> getDeliveriesForUser(String userRole, UUID userId) {
        return ventaRepository.findAll()
                .filter(venta -> !"ANULADA".equalsIgnoreCase(venta.getEstado()))
                .filter(venta -> "ADMIN".equals(userRole)
                        || venta.getAssignedCourierId() == null
                        || userId.equals(venta.getAssignedCourierId()))
                .flatMap(venta -> ventaDetalleRepository.findByVentaId(venta.id())
                        .collectList()
                        .map(detalles -> toResponse(venta, detalles)));
    }

    public Flux<VentaResponse> getVentasByCliente(UUID clienteId) {
        return ventaRepository.findByClienteId(clienteId)
                .flatMap(venta -> ventaDetalleRepository.findByVentaId(venta.id())
                        .collectList()
                        .map(detalles -> toResponse(venta, detalles)));
    }

    public Flux<VentaResponse> getVentasByVendedor(UUID vendedorId) {
        return ventaRepository.findByVendedorId(vendedorId)
                .flatMap(venta -> ventaDetalleRepository.findByVentaId(venta.id())
                        .collectList()
                        .map(detalles -> toResponse(venta, detalles)));
    }

    @Transactional
    public Mono<VentaResponse> anularVenta(UUID ventaId, UUID userId) {
        return ventaRepository.findById(ventaId)
                .flatMap(venta -> {
                    venta.setEstado("ANULADA");
                    return ventaRepository.save(venta);
                })
                .zipWith(ventaDetalleRepository.findByVentaId(ventaId).collectList())
                .map(tuple -> toResponse(tuple.getT1(), tuple.getT2()));
    }

    @Transactional
    public Mono<VentaResponse> updateDeliveryTracking(UUID ventaId,
                                                      UUID requesterId,
                                                      String requesterRole,
                                                      DeliveryTrackingUpdateRequest request) {
        return ventaRepository.findById(ventaId)
                .switchIfEmpty(Mono.error(new RuntimeException("No se encontro la venta indicada")))
                .flatMap(venta -> {
                    if ("ANULADA".equalsIgnoreCase(venta.getEstado())) {
                        return Mono.error(new RuntimeException("No se puede actualizar una venta anulada"));
                    }

                    boolean isAdmin = "ADMIN".equalsIgnoreCase(requesterRole);
                    UUID assignedCourierId = venta.getAssignedCourierId();
                    if (!isAdmin && assignedCourierId != null && !requesterId.equals(assignedCourierId)) {
                        return Mono.error(new RuntimeException("Esta entrega ya fue tomada por otro domiciliario"));
                    }

                    DeliveryState nextState = sanitizeDeliveryState(request);
                    LocalDateTime now = LocalDateTime.now();
                    syncTrackingTimestamps(venta, nextState, now);

                    venta.setPacked(nextState.packed());
                    venta.setPickedUp(nextState.pickedUp());
                    venta.setOnTheWay(nextState.onTheWay());
                    venta.setDelivered(nextState.delivered());
                    venta.setDeliveryUpdatedAt(now);
                    venta.setDeliveryUpdatedBy(requesterId);

                    if (request.evidenceUrl() != null) {
                        venta.setDeliveryEvidenceUrl(normalizeOptional(request.evidenceUrl()));
                    }
                    if (request.notes() != null) {
                        venta.setDeliveryNotes(normalizeOptional(request.notes()));
                    }
                    if (request.latitude() != null) {
                        venta.setTrackingLatitude(request.latitude());
                    }
                    if (request.longitude() != null) {
                        venta.setTrackingLongitude(request.longitude());
                    }

                    if (!isAdmin && venta.getAssignedCourierId() == null && nextState.hasProgress()) {
                        venta.setAssignedCourierId(requesterId);
                    }

                    return ventaRepository.save(venta);
                })
                .zipWith(ventaDetalleRepository.findByVentaId(ventaId).collectList())
                .map(tuple -> toResponse(tuple.getT1(), tuple.getT2()));
    }

    private Mono<BigDecimal> fetchProductPrice(UUID productId) {
        return fetchProductInfo(productId).map(ProductInfoDto::price);
    }

    /**
     * Fase 2c: un unico fetch al catalogo por producto. Devuelve un ProductInfoDto
     * con precio + artesanoId para poder snapshotear en el VentaDetalle.
     * Ante error de red/404, devuelve un DTO con precio 0 y artesanoId null para
     * que el caller pueda abortar ("No se pudo determinar el precio").
     */
    private Mono<ProductInfoDto> fetchProductInfo(UUID productId) {
        return catalogWebClient.get()
                .uri("/api/products/{id}", productId)
                .retrieve()
                .bodyToMono(ProductInfoDto.class)
                .onErrorReturn(new ProductInfoDto(productId, null, BigDecimal.ZERO, null));
    }

    private VentaResponse toResponse(Venta venta, List<VentaDetalle> detalles) {
        List<VentaDetalleResponse> detalleResponses = detalles.stream()
                .map(d -> new VentaDetalleResponse(d.id(), d.productId(), d.cantidad(),
                                                   d.precioUnitario(), d.subtotal(),
                                                   d.artesanoId()))
                .collect(Collectors.toList());

        DeliveryTrackingResponse deliveryTracking = new DeliveryTrackingResponse(
                venta.getAssignedCourierId(),
                venta.isPacked(),
                venta.isPickedUp(),
                venta.isOnTheWay(),
                venta.isDelivered(),
                calculateProgress(venta),
                resolveStage(venta),
                venta.getDeliveryUpdatedAt(),
                venta.getDeliveryUpdatedBy(),
                venta.getPackedAt(),
                venta.getPickedUpAt(),
                venta.getOnTheWayAt(),
                venta.getDeliveredAt(),
                venta.getTrackingLatitude(),
                venta.getTrackingLongitude(),
                venta.getDeliveryEvidenceUrl(),
                venta.getDeliveryNotes()
        );

        return new VentaResponse(venta.id(), venta.clienteId(), venta.vendedorId(),
                                venta.total(), venta.estado(), venta.createdAt(), deliveryTracking, detalleResponses);
    }

    private int calculateProgress(Venta venta) {
        if (venta.isDelivered()) {
            return 100;
        }
        if (venta.isOnTheWay()) {
            return 85;
        }
        if (venta.isPickedUp()) {
            return 55;
        }
        if (venta.isPacked()) {
            return 40;
        }
        if ("PAGADA".equalsIgnoreCase(venta.estado()) || "COMPLETADA".equalsIgnoreCase(venta.estado())) {
            return 10;
        }
        return 0;
    }

    private String resolveStage(Venta venta) {
        if (venta.isDelivered()) {
            return "ENTREGADO";
        }
        if (venta.isOnTheWay()) {
            return "EN_RUTA";
        }
        if (venta.isPickedUp()) {
            return "RECOGIDO";
        }
        if (venta.isPacked()) {
            return "EMPACADO";
        }
        return "PENDIENTE";
    }

    private DeliveryState sanitizeDeliveryState(DeliveryTrackingUpdateRequest request) {
        boolean packed = Boolean.TRUE.equals(request.packed());
        boolean pickedUp = Boolean.TRUE.equals(request.pickedUp());
        boolean onTheWay = Boolean.TRUE.equals(request.onTheWay());
        boolean delivered = Boolean.TRUE.equals(request.delivered());

        if (!packed) {
            pickedUp = false;
            onTheWay = false;
            delivered = false;
        }
        if (pickedUp) {
            packed = true;
        } else {
            onTheWay = false;
            delivered = false;
        }
        if (onTheWay) {
            packed = true;
            pickedUp = true;
        } else {
            delivered = false;
        }
        if (delivered) {
            packed = true;
            pickedUp = true;
            onTheWay = true;
        }

        return new DeliveryState(packed, pickedUp, onTheWay, delivered);
    }

    private void syncTrackingTimestamps(Venta venta, DeliveryState nextState, LocalDateTime now) {
        if (nextState.packed() && !venta.isPacked()) {
            venta.setPackedAt(now);
        }
        if (!nextState.packed()) {
            venta.setPackedAt(null);
        }

        if (nextState.pickedUp() && !venta.isPickedUp()) {
            venta.setPickedUpAt(now);
        }
        if (!nextState.pickedUp()) {
            venta.setPickedUpAt(null);
        }

        if (nextState.onTheWay() && !venta.isOnTheWay()) {
            venta.setOnTheWayAt(now);
        }
        if (!nextState.onTheWay()) {
            venta.setOnTheWayAt(null);
        }

        if (nextState.delivered() && !venta.isDelivered()) {
            venta.setDeliveredAt(now);
        }
        if (!nextState.delivered()) {
            venta.setDeliveredAt(null);
        }
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private record DeliveryState(boolean packed, boolean pickedUp, boolean onTheWay, boolean delivered) {
        boolean hasProgress() {
            return packed || pickedUp || onTheWay || delivered;
        }
    }
}
