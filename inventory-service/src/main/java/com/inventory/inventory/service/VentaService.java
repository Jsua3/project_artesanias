package com.inventory.inventory.service;

import com.inventory.inventory.dto.*;
import com.inventory.inventory.model.Venta;
import com.inventory.inventory.model.VentaDetalle;
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
    private final WebClient catalogWebClient;

    public VentaService(VentaRepository ventaRepository,
                       VentaDetalleRepository ventaDetalleRepository,
                       WebClient catalogWebClient) {
        this.ventaRepository = ventaRepository;
        this.ventaDetalleRepository = ventaDetalleRepository;
        this.catalogWebClient = catalogWebClient;
    }

    @Transactional
    public Mono<VentaResponse> createVenta(VentaRequest request, UUID vendedorId) {
        UUID ventaId = UUID.randomUUID();

        return Flux.fromIterable(request.items())
                .flatMap(item -> fetchProductPrice(item.productId())
                        .map(price -> new VentaDetalle(
                                UUID.randomUUID(),
                                ventaId,
                                item.productId(),
                                item.cantidad(),
                                price,
                                price.multiply(BigDecimal.valueOf(item.cantidad()))
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
                                        .flatMap(d -> ventaDetalleRepository.save(d.withIsNew(true)))
                                        .collectList()
                            )
                            .map(savedDetalles -> toResponse(venta, savedDetalles));
                });
    }

    public Mono<VentaResponse> getVenta(UUID id) {
        return ventaRepository.findById(id)
                .zipWith(ventaDetalleRepository.findByVentaId(id).collectList())
                .map(tuple -> toResponse(tuple.getT1(), tuple.getT2()));
    }

    public Flux<VentaResponse> getAllVentas() {
        return ventaRepository.findAll()
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
                    Venta anulada = new Venta(ventaId, venta.clienteId(), venta.vendedorId(),
                                             venta.total(), "ANULADA", venta.createdAt());
                    return ventaRepository.save(anulada);
                })
                .zipWith(ventaDetalleRepository.findByVentaId(ventaId).collectList())
                .map(tuple -> toResponse(tuple.getT1(), tuple.getT2()));
    }

    private Mono<BigDecimal> fetchProductPrice(UUID productId) {
        return catalogWebClient.get()
                .uri("/api/products/{id}", productId)
                .retrieve()
                .bodyToMono(ProductInfoDto.class)
                .map(ProductInfoDto::price)
                .onErrorReturn(BigDecimal.ZERO);
    }

    private VentaResponse toResponse(Venta venta, List<VentaDetalle> detalles) {
        List<VentaDetalleResponse> detalleResponses = detalles.stream()
                .map(d -> new VentaDetalleResponse(d.id(), d.productId(), d.cantidad(),
                                                   d.precioUnitario(), d.subtotal()))
                .collect(Collectors.toList());

        return new VentaResponse(venta.id(), venta.clienteId(), venta.vendedorId(),
                                venta.total(), venta.estado(), venta.createdAt(), detalleResponses);
    }
}
