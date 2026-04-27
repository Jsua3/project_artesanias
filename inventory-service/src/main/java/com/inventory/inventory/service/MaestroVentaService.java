package com.inventory.inventory.service;

import com.inventory.inventory.dto.ArtesanoInfoDto;
import com.inventory.inventory.dto.DeliveryTrackingResponse;
import com.inventory.inventory.dto.VentaDetalleResponse;
import com.inventory.inventory.dto.VentaResponse;
import com.inventory.inventory.model.Cliente;
import com.inventory.inventory.model.Venta;
import com.inventory.inventory.model.VentaDetalle;
import com.inventory.inventory.repository.ClienteRepository;
import com.inventory.inventory.repository.VentaDetalleRepository;
import com.inventory.inventory.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Fase 2c: endpoint de MAESTRO.
 *
 * Resuelve user_account_id (del JWT) -> artesano_id (via catalog-service)
 * -> todas las ventas que tienen al menos una linea con ese artesano.
 *
 * El listado incluye todas las lineas de cada venta (incluso las de otros
 * artesanos), asi el maestro ve el contexto completo; el frontend puede
 * filtrar/resaltar las suyas usando el campo artesanoId del detalle.
 */
@Service
public class MaestroVentaService {

    private final VentaRepository ventaRepository;
    private final VentaDetalleRepository ventaDetalleRepository;
    private final ClienteRepository clienteRepository;
    private final WebClient catalogWebClient;

    public MaestroVentaService(VentaRepository ventaRepository,
                               VentaDetalleRepository ventaDetalleRepository,
                               ClienteRepository clienteRepository,
                               WebClient catalogWebClient) {
        this.ventaRepository = ventaRepository;
        this.ventaDetalleRepository = ventaDetalleRepository;
        this.clienteRepository = clienteRepository;
        this.catalogWebClient = catalogWebClient;
    }

    /**
     * Devuelve el artesano vinculado al user_account dado, o Mono.empty()
     * si no existe el link (el usuario no es maestro).
     */
    public Mono<ArtesanoInfoDto> resolveArtesanoForUser(UUID userAccountId) {
        return catalogWebClient.get()
                .uri("/internal/artesanos/by-user/{id}", userAccountId)
                .retrieve()
                .bodyToMono(ArtesanoInfoDto.class)
                .onErrorResume(e -> Mono.empty());
    }

    /**
     * Lista las ventas en las que el maestro tiene al menos una linea.
     * Estados filtrables opcionalmente (null = todos los estados).
     */
    public Flux<VentaResponse> getVentasForMaestro(UUID userAccountId) {
        return resolveArtesanoForUser(userAccountId)
                .flatMapMany(artesano ->
                        ventaDetalleRepository.findByArtesanoId(artesano.id())
                                .map(VentaDetalle::ventaId)
                                .distinct()
                                .flatMap(this::hydrateVenta)
                );
    }

    private Mono<VentaResponse> hydrateVenta(UUID ventaId) {
        return ventaRepository.findById(ventaId)
                .flatMap(venta -> ventaDetalleRepository.findByVentaId(ventaId).collectList()
                        .flatMap(detalles -> resolveClienteName(venta)
                                .map(name -> toResponse(venta, detalles, name))));
    }

    private Mono<String> resolveClienteName(Venta venta) {
        if (venta.getShippingRecipientName() != null && !venta.getShippingRecipientName().isBlank()) {
            return Mono.just(venta.getShippingRecipientName());
        }
        if (venta.clienteId() == null) {
            return Mono.just("Cliente");
        }
        return clienteRepository.findById(venta.clienteId())
                .map(c -> c.nombre() != null && !c.nombre().isBlank() ? c.nombre() : "Cliente")
                .defaultIfEmpty("Cliente");
    }

    private VentaResponse toResponse(Venta venta, List<VentaDetalle> detalles, String clienteName) {
        List<VentaDetalleResponse> detalleResponses = detalles.stream()
                .filter(Objects::nonNull)
                .map(d -> new VentaDetalleResponse(
                        d.id(), d.productId(), d.cantidad(),
                        d.precioUnitario(), d.subtotal(), d.artesanoId()))
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

        return new VentaResponse(
                venta.id(), venta.clienteId(), venta.vendedorId(),
                venta.total(), venta.estado(), venta.createdAt(), deliveryTracking, detalleResponses,
                null, null, clienteName);
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
}
