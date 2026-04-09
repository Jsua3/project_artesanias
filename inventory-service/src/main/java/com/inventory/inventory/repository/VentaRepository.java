package com.inventory.inventory.repository;

import com.inventory.inventory.model.Venta;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface VentaRepository extends ReactiveCrudRepository<Venta, UUID> {
    Flux<Venta> findByClienteId(UUID clienteId);
    Flux<Venta> findByVendedorId(UUID vendedorId);
}
