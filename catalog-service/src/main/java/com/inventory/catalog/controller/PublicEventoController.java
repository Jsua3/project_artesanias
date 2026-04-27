package com.inventory.catalog.controller;

import com.inventory.catalog.dto.PublicEventoResponse;
import com.inventory.catalog.repository.CommunityEventRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/public")
public class PublicEventoController {

    private final CommunityEventRepository eventRepository;

    public PublicEventoController(CommunityEventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @GetMapping("/eventos")
    public Flux<PublicEventoResponse> listApprovedEvents() {
        return eventRepository.findApprovedUpcoming()
                .map(e -> new PublicEventoResponse(
                        e.id(),
                        e.nombre(),
                        e.descripcion(),
                        e.fechaInicio(),
                        e.localidad() != null ? e.localidad() + (e.direccionExacta() != null ? ", " + e.direccionExacta() : "") : null,
                        null,
                        e.artesanoNombre()
                ));
    }
}
