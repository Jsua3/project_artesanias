package com.inventory.catalog.service;

import com.inventory.catalog.dto.ArtesanoRequest;
import com.inventory.catalog.dto.ArtesanoResponse;
import com.inventory.catalog.dto.SyncArtesanoRequest;
import com.inventory.catalog.model.Artesano;
import com.inventory.catalog.repository.ArtesanoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ArtesanoService {

    private final ArtesanoRepository artesanoRepository;

    public ArtesanoService(ArtesanoRepository artesanoRepository) {
        this.artesanoRepository = artesanoRepository;
    }

    @Transactional
    public Mono<ArtesanoResponse> createArtesano(ArtesanoRequest request) {
        UUID id = UUID.randomUUID();
        Artesano artesano = new Artesano(
                id,
                request.nombre(),
                request.telefono(),
                request.email(),
                request.especialidad(),
                request.ubicacion(),
                true,
                LocalDateTime.now()
        );
        artesano.setImageUrl(request.imageUrl());
        return artesanoRepository.save(artesano.withIsNew(true))
                .map(this::toResponse);
    }

    public Mono<ArtesanoResponse> getArtesano(UUID id) {
        return artesanoRepository.findById(id)
                .filter(a -> Boolean.TRUE.equals(a.active()))
                .map(this::toResponse);
    }

    public Flux<ArtesanoResponse> getAllArtesanos() {
        return artesanoRepository.findAll()
                .filter(a -> Boolean.TRUE.equals(a.active()))
                .map(this::toResponse);
    }

    @Transactional
    public Mono<ArtesanoResponse> updateArtesano(UUID id, ArtesanoRequest request) {
        return artesanoRepository.findById(id)
                .flatMap(existing -> {
                    Artesano updated = new Artesano(
                            id,
                            request.nombre(),
                            request.telefono(),
                            request.email(),
                            request.especialidad(),
                            request.ubicacion(),
                            existing.active(),
                            existing.createdAt()
                    );
                    updated.setImageUrl(request.imageUrl());
                    // Preservar el link con user_account (se muta por otro endpoint)
                    updated.setUserAccountId(existing.userAccountId());
                    return artesanoRepository.save(updated);
                })
                .map(this::toResponse);
    }

    @Transactional
    public Mono<Void> deleteArtesano(UUID id) {
        return artesanoRepository.findById(id)
                .flatMap(existing -> {
                    Artesano softDeleted = new Artesano(
                            id,
                            existing.nombre(),
                            existing.telefono(),
                            existing.email(),
                            existing.especialidad(),
                            existing.ubicacion(),
                            false,
                            existing.createdAt()
                    );
                    softDeleted.setImageUrl(existing.imageUrl());
                    softDeleted.setUserAccountId(existing.userAccountId());
                    return artesanoRepository.save(softDeleted);
                })
                .then();
    }

    /**
     * Fase 2c: vincula un artesano con un user_account (rol MAESTRO).
     * Pasa null para desvincular. Solo admin debe poder invocarlo.
     */
    @Transactional
    public Mono<ArtesanoResponse> linkUserAccount(UUID artesanoId, UUID userAccountId) {
        return artesanoRepository.findById(artesanoId)
                .flatMap(existing -> {
                    existing.setUserAccountId(userAccountId);
                    return artesanoRepository.save(existing);
                })
                .map(this::toResponse);
    }

    /** Fase 2c: lookup para /api/maestro-ventas/mias. */
    public Mono<ArtesanoResponse> findByUserAccountId(UUID userAccountId) {
        return artesanoRepository.findByUserAccountId(userAccountId)
                .map(this::toResponse);
    }

    /**
     * Crea un artesano para el usuario ARTESANO recién aprobado si todavía no existe.
     * Si ya existe (por un aprobación previa o creación manual), lo devuelve sin modificar.
     * Llamado desde auth-service vía API interna al aprobar un usuario.
     */
    @Transactional
    public Mono<ArtesanoResponse> findOrCreateForUser(SyncArtesanoRequest request) {
        return artesanoRepository.findByUserAccountId(request.userAccountId())
                .switchIfEmpty(Mono.defer(() -> {
                    String nombre = (request.nombre() != null && !request.nombre().isBlank())
                            ? request.nombre()
                            : request.email();
                    Artesano artesano = new Artesano(
                            UUID.randomUUID(),
                            nombre,
                            null,
                            request.email(),
                            request.especialidad(),
                            request.ubicacion(),
                            true,
                            LocalDateTime.now()
                    );
                    artesano.setUserAccountId(request.userAccountId());
                    if (request.avatarUrl() != null && !request.avatarUrl().isBlank()) {
                        artesano.setImageUrl(request.avatarUrl());
                    }
                    return artesanoRepository.save(artesano.withIsNew(true));
                }))
                .map(this::toResponse);
    }

    private ArtesanoResponse toResponse(Artesano artesano) {
        return new ArtesanoResponse(
                artesano.id(),
                artesano.nombre(),
                artesano.telefono(),
                artesano.email(),
                artesano.especialidad(),
                artesano.ubicacion(),
                artesano.imageUrl(),
                artesano.active(),
                artesano.userAccountId(),
                artesano.createdAt()
        );
    }
}
