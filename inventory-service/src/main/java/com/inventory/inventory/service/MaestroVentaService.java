package com.inventory.inventory.service;

import com.inventory.inventory.dto.ArtesanoInfoDto;
import com.inventory.inventory.dto.VentaDetalleResponse;
import com.inventory.inventory.dto.VentaResponse;
import com.inventory.inventory.model.Venta;
import com.inventory.inventory.model.VentaDetalle;
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
    private final WebClient catalogWebClient;

    public MaestroVentaService(VentaRepository ventaRepository,
                               VentaDetalleRepository ventaDetalleRepository,
                               WebClient catalogWebClient) {
        this.ventaRepository = ventaRepository;
        this.ventaDetalleRepository = ventaDetalleRepository;
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
                .zipWith(ventaDetalleRepository.findByVentaId(ventaId).collectList())
                .map(t -> toResponse(t.getT1(), t.getT2()));
    }

    private VentaResponse toResponse(Venta venta, List<VentaDetalle> detalles) {
        List<VentaDetalleResponse> detalleResponses = detalles.stream()
                .filter(Objects::nonNull)
                .map(d -> new VentaDetalleResponse(
                        d.id(), d.productId(), d.cantidad(),
                        d.precioUnitario(), d.subtotal(), d.artesanoId()))
                .collect(Collectors.toList());
        return new VentaResponse(
                venta.id(), venta.clienteId(), venta.vendedorId(),
                venta.total(), venta.estado(), venta.createdAt(), detalleResponses);
    }
}
