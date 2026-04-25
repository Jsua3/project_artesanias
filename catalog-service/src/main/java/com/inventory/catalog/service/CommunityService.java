package com.inventory.catalog.service;

import com.inventory.catalog.dto.CommunityEventRequest;
import com.inventory.catalog.dto.CommunityEventResponse;
import com.inventory.catalog.dto.CommunityPostRequest;
import com.inventory.catalog.dto.CommunityPostResponse;
import com.inventory.catalog.model.CommunityEvent;
import com.inventory.catalog.model.CommunityPost;
import com.inventory.catalog.model.CommunityPostLike;
import com.inventory.catalog.repository.CommunityEventRepository;
import com.inventory.catalog.repository.CommunityPostLikeRepository;
import com.inventory.catalog.repository.CommunityPostRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Service
public class CommunityService {

    private static final Set<String> POST_STATES = Set.of("ACTIVO", "REPORTADO", "ELIMINADO");
    private static final Set<String> EVENT_STATES = Set.of("PENDIENTE", "APROBADO", "RECHAZADO");

    private final CommunityPostRepository postRepository;
    private final CommunityPostLikeRepository likeRepository;
    private final CommunityEventRepository eventRepository;
    private final CommunityModerationService moderationService;

    public CommunityService(CommunityPostRepository postRepository,
                            CommunityPostLikeRepository likeRepository,
                            CommunityEventRepository eventRepository,
                            CommunityModerationService moderationService) {
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.eventRepository = eventRepository;
        this.moderationService = moderationService;
    }

    public Flux<CommunityPostResponse> getActivePosts(UUID currentUserId) {
        return postRepository.findActiveFeed()
                .flatMap(post -> toPostResponse(post, currentUserId));
    }

    public Flux<CommunityPostResponse> getPostsForModeration(UUID currentUserId) {
        return postRepository.findModerationFeed()
                .flatMap(post -> toPostResponse(post, currentUserId));
    }

    @Transactional
    public Mono<CommunityPostResponse> createPost(UUID authorId, CommunityPostRequest request) {
        String content = moderationService.validatePostContent(request.content());
        LocalDateTime now = LocalDateTime.now();
        CommunityPost post = new CommunityPost(
                UUID.randomUUID(),
                authorId,
                displayName(authorId, request.authorName()),
                moderationService.normalizeOptional(request.authorAvatarUrl()),
                content,
                moderationService.normalizeOptional(request.imageUrl()),
                0,
                0,
                "ACTIVO",
                now,
                now
        );
        return postRepository.save(post.withIsNew(true))
                .flatMap(saved -> toPostResponse(saved, authorId));
    }

    @Transactional
    public Mono<CommunityPostResponse> reportPost(UUID postId, UUID currentUserId) {
        return findVisiblePost(postId)
                .flatMap(post -> {
                    post.setEstado("REPORTADO");
                    post.setUpdatedAt(LocalDateTime.now());
                    return postRepository.save(post);
                })
                .flatMap(post -> toPostResponse(post, currentUserId));
    }

    @Transactional
    public Mono<CommunityPostResponse> updatePostStatus(UUID postId, String estado, UUID currentUserId) {
        String normalized = normalizeState(estado, POST_STATES, "Estado de publicación inválido.");
        return postRepository.findById(postId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Publicación no encontrada.")))
                .flatMap(post -> {
                    post.setEstado(normalized);
                    post.setUpdatedAt(LocalDateTime.now());
                    return postRepository.save(post);
                })
                .flatMap(post -> toPostResponse(post, currentUserId));
    }

    @Transactional
    public Mono<Void> deletePost(UUID postId, UUID currentUserId, boolean admin) {
        return postRepository.findById(postId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Publicación no encontrada.")))
                .flatMap(post -> {
                    if (!admin && !post.authorId().equals(currentUserId)) {
                        return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes eliminar esta publicación."));
                    }
                    post.setEstado("ELIMINADO");
                    post.setUpdatedAt(LocalDateTime.now());
                    return postRepository.save(post);
                })
                .then();
    }

    @Transactional
    public Mono<CommunityPostResponse> toggleLike(UUID postId, UUID userId) {
        return findVisiblePost(postId)
                .flatMap(post -> likeRepository.findByPostIdAndUserId(postId, userId)
                        .flatMap(existing -> likeRepository.delete(existing)
                                .then(updateLikeCount(post, -1, userId)))
                        .switchIfEmpty(Mono.defer(() -> {
                            CommunityPostLike like = new CommunityPostLike(UUID.randomUUID(), postId, userId, LocalDateTime.now());
                            return likeRepository.save(like.withIsNew(true))
                                    .then(updateLikeCount(post, 1, userId));
                        })));
    }

    public Flux<CommunityEventResponse> getMyEvents(UUID artesanoId) {
        return eventRepository.findByArtesanoIdOrdered(artesanoId)
                .map(this::toEventResponse);
    }

    public Flux<CommunityEventResponse> getPendingEvents() {
        return eventRepository.findByEstadoOrdered("PENDIENTE")
                .map(this::toEventResponse);
    }

    public Flux<CommunityEventResponse> getAllEvents() {
        return eventRepository.findAllOrdered()
                .map(this::toEventResponse);
    }

    @Transactional
    public Mono<CommunityEventResponse> createEvent(UUID artesanoId, CommunityEventRequest request) {
        validateEventDates(request.fechaInicio(), request.fechaFin());
        LocalDateTime now = LocalDateTime.now();
        CommunityEvent event = new CommunityEvent(
                UUID.randomUUID(),
                artesanoId,
                displayName(artesanoId, request.artesanoNombre()),
                moderationService.normalizeRequired(request.organizacion(), "La organización es obligatoria."),
                moderationService.normalizeRequired(request.nombre(), "El nombre del evento es obligatorio."),
                moderationService.normalizeRequired(request.localidad(), "La localidad es obligatoria."),
                moderationService.normalizeOptional(request.direccionExacta()),
                request.fechaInicio(),
                request.fechaFin(),
                moderationService.normalizeRequired(request.hora(), "La hora es obligatoria."),
                moderationService.normalizeOptional(request.descripcion()),
                "PENDIENTE",
                now,
                now
        );
        return eventRepository.save(event.withIsNew(true))
                .map(this::toEventResponse);
    }

    @Transactional
    public Mono<CommunityEventResponse> reviewEvent(UUID eventId, UUID reviewerId, String decision, String comentario) {
        String normalized = normalizeState(decision, EVENT_STATES, "Decisión de evento inválida.");
        if ("PENDIENTE".equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La decisión debe ser APROBADO o RECHAZADO.");
        }
        return eventRepository.findById(eventId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado.")))
                .flatMap(event -> {
                    event.setEstado(normalized);
                    event.setReviewComment(moderationService.normalizeOptional(comentario));
                    event.setReviewedBy(reviewerId);
                    event.setReviewedAt(LocalDateTime.now());
                    event.setUpdatedAt(LocalDateTime.now());
                    return eventRepository.save(event);
                })
                .map(this::toEventResponse);
    }

    private Mono<CommunityPost> findVisiblePost(UUID postId) {
        return postRepository.findById(postId)
                .filter(post -> !"ELIMINADO".equals(post.estado()))
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Publicación no encontrada.")));
    }

    private Mono<CommunityPostResponse> updateLikeCount(CommunityPost post, int delta, UUID userId) {
        int current = post.likesCount() != null ? post.likesCount() : 0;
        post.setLikesCount(Math.max(0, current + delta));
        post.setUpdatedAt(LocalDateTime.now());
        return postRepository.save(post)
                .flatMap(saved -> toPostResponse(saved, userId));
    }

    private Mono<CommunityPostResponse> toPostResponse(CommunityPost post, UUID currentUserId) {
        Mono<Boolean> liked = currentUserId == null
                ? Mono.just(false)
                : likeRepository.findByPostIdAndUserId(post.id(), currentUserId).hasElement();
        return liked.map(likedByMe -> new CommunityPostResponse(
                post.id(),
                post.authorId(),
                post.authorName(),
                post.authorAvatarUrl(),
                post.content(),
                post.imageUrl(),
                post.createdAt(),
                post.likesCount(),
                post.commentsCount(),
                post.estado(),
                likedByMe
        ));
    }

    private CommunityEventResponse toEventResponse(CommunityEvent event) {
        return new CommunityEventResponse(
                event.id(),
                event.artesanoId(),
                event.artesanoNombre(),
                event.organizacion(),
                event.nombre(),
                event.localidad(),
                event.direccionExacta(),
                event.fechaInicio(),
                event.fechaFin(),
                event.hora(),
                event.descripcion(),
                event.estado(),
                event.reviewComment(),
                event.createdAt()
        );
    }

    private String displayName(UUID userId, String requestedName) {
        String normalized = moderationService.normalizeOptional(requestedName);
        if (normalized != null) {
            return normalized;
        }
        String shortId = userId == null ? "anonimo" : userId.toString().substring(0, 8);
        return "Artesano " + shortId;
    }

    private String normalizeState(String value, Set<String> allowed, String message) {
        String normalized = value == null ? "" : value.trim().toUpperCase();
        if (!allowed.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }

    private void validateEventDates(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las fechas del evento son obligatorias.");
        }
        if (end.isBefore(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha final no puede ser anterior a la fecha inicial.");
        }
    }
}
