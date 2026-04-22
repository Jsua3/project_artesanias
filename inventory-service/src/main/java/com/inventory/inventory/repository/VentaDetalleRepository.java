package com.inventory.inventory.repository;

import com.inventory.inventory.model.VentaDetalle;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface VentaDetalleRepository extends ReactiveCrudRepository<VentaDetalle, UUID> {
    Flux<VentaDetalle> findByVentaId(UUID ventaId);

    /** Fase 2c: todas las líneas donde el artesano fue snapshoteado. */
    Flux<VentaDetalle> findByArtesanoId(UUID artesanoId);
}
