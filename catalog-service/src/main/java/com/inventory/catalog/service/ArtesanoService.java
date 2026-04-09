package com.inventory.catalog.service;

import com.inventory.catalog.dto.ArtesanoRequest;
import com.inventory.catalog.dto.ArtesanoResponse;
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
                    return artesanoRepository.save(softDeleted);
                })
                .then();
    }

    private ArtesanoResponse toResponse(Artesano artesano) {
        return new ArtesanoResponse(
                artesano.id(),
                artesano.nombre(),
                artesano.telefono(),
                artesano.email(),
                artesano.especialidad(),
                artesano.ubicacion(),
                artesano.active(),
                artesano.createdAt()
        );
    }
}
