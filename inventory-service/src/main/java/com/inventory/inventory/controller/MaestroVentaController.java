package com.inventory.inventory.controller;

import com.inventory.inventory.dto.VentaResponse;
import com.inventory.inventory.service.MaestroVentaService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;

import java.util.UUID;

/**
 * Fase 2c: endpoints para un usuario con rol MAESTRO. Consulta ventas
 * donde al menos una línea le pertenece (artesano_id snapshoteado).
 *
 * api-gateway inyecta X-User-Id y X-User-Role después de validar el JWT.
 * No hay UI ligada a estos endpoints en esta fase; son para smoke tests
 * vía cURL / futuro panel del maestro.
 */
@RestController
@RequestMapping("/api/maestro-ventas")
public class MaestroVentaController {

    private final MaestroVentaService maestroVentaService;

    public MaestroVentaController(MaestroVentaService maestroVentaService) {
        this.maestroVentaService = maestroVentaService;
    }

    /** Lista las ventas del maestro autenticado (cualquier estado). */
    @GetMapping("/mias")
    public Flux<VentaResponse> mias(
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (userId.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (!"ARTESANO".equals(userRole) && !"ADMIN".equals(userRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        UUID uid;
        try {
            uid = UUID.fromString(userId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid X-User-Id");
        }
        return maestroVentaService.getVentasForMaestro(uid);
    }
}
