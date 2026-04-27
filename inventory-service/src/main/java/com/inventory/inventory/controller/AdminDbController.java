package com.inventory.inventory.controller;

import com.inventory.inventory.dto.*;
import com.inventory.inventory.model.Venta;
import com.inventory.inventory.repository.ClienteRepository;
import com.inventory.inventory.repository.VentaDetalleRepository;
import com.inventory.inventory.repository.VentaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/db")
public class AdminDbController {

    private final ClienteRepository clienteRepository;
    private final VentaRepository ventaRepository;
    private final VentaDetalleRepository ventaDetalleRepository;

    public AdminDbController(ClienteRepository clienteRepository,
                             VentaRepository ventaRepository,
                             VentaDetalleRepository ventaDetalleRepository) {
        this.clienteRepository = clienteRepository;
        this.ventaRepository = ventaRepository;
        this.ventaDetalleRepository = ventaDetalleRepository;
    }

    @GetMapping("/clientes")
    public Mono<PagedResponse<ClienteResponse>> listClientes(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String search) {
        requireAdmin(userRole);
        int safeSize = Math.min(size, 100);
        return clienteRepository.findAll()
                .filter(c -> search.isBlank()
                        || (c.nombre() != null && c.nombre().toLowerCase().contains(search.toLowerCase()))
                        || (c.email() != null && c.email().toLowerCase().contains(search.toLowerCase())))
                .collectList()
                .map(all -> paginate(all.stream()
                        .map(c -> new ClienteResponse(c.id(), c.nombre(), c.telefono(),
                                c.email(), c.direccion(), c.createdAt()))
                        .collect(Collectors.toList()), page, safeSize));
    }

    @GetMapping("/ventas")
    public Mono<PagedResponse<VentaResponse>> listVentas(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String estado) {
        requireAdmin(userRole);
        int safeSize = Math.min(size, 100);
        return ventaRepository.findAll()
                .filter(v -> estado.isBlank() || estado.equalsIgnoreCase(v.getEstado()))
                .flatMap(v -> ventaDetalleRepository.findByVentaId(v.id()).collectList()
                        .map(detalles -> toVentaResponse(v, detalles)))
                .collectList()
                .map(all -> paginate(all, page, safeSize));
    }

    @GetMapping("/pedidos")
    public Mono<PagedResponse<VentaResponse>> listPedidos(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdmin(userRole);
        int safeSize = Math.min(size, 100);
        return ventaRepository.findAll()
                .filter(v -> !"COMPLETADA".equalsIgnoreCase(v.getEstado()))
                .flatMap(v -> ventaDetalleRepository.findByVentaId(v.id()).collectList()
                        .map(detalles -> toVentaResponse(v, detalles)))
                .collectList()
                .map(all -> paginate(all, page, safeSize));
    }

    private void requireAdmin(String userRole) {
        if (!"ADMIN".equals(userRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private <T> PagedResponse<T> paginate(List<T> all, int page, int size) {
        long total = all.size();
        int totalPages = (int) Math.ceil((double) total / size);
        List<T> content = all.stream().skip((long) page * size).limit(size).collect(Collectors.toList());
        return new PagedResponse<>(content, page, size, total, totalPages);
    }

    private VentaResponse toVentaResponse(Venta v, java.util.List<com.inventory.inventory.model.VentaDetalle> detalles) {
        var detalleResponses = detalles.stream()
                .map(d -> new VentaDetalleResponse(d.id(), d.productId(), d.cantidad(),
                        d.precioUnitario(), d.subtotal(), d.artesanoId()))
                .collect(Collectors.toList());
        return new VentaResponse(v.id(), v.clienteId(), v.vendedorId(), v.total(),
                v.estado(), v.createdAt(), null, detalleResponses);
    }
}
