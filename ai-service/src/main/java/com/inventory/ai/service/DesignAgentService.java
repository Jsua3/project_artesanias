package com.inventory.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.ai.config.OpenAiProperties;
import com.inventory.ai.dto.ConfirmDesignRequest;
import com.inventory.ai.dto.CustomDesignResponse;
import com.inventory.ai.dto.DesignSpec;
import com.inventory.ai.dto.DesignTurnRequest;
import com.inventory.ai.dto.DesignTurnResponse;
import com.inventory.ai.dto.DesignNotificationResponse;
import com.inventory.ai.dto.PriceBreakdown;
import com.inventory.ai.dto.PreviewResponse;
import com.inventory.ai.model.CustomDesignNotification;
import com.inventory.ai.model.CustomDesignRequest;
import com.inventory.ai.repository.CustomDesignNotificationRepository;
import com.inventory.ai.repository.CustomDesignRequestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class DesignAgentService {

    private static final List<String> REBECCA_PALETTE = List.of("#704A2E", "#C9A253", "#F5F0E8");

    private final WebClient openAiWebClient;
    private final OpenAiProperties properties;
    private final ObjectMapper objectMapper;
    private final PricingService pricingService;
    private final CustomDesignRequestRepository customDesignRequestRepository;
    private final CustomDesignNotificationRepository notificationRepository;

    public DesignAgentService(
            WebClient openAiWebClient,
            OpenAiProperties properties,
            ObjectMapper objectMapper,
            PricingService pricingService,
            CustomDesignRequestRepository customDesignRequestRepository,
            CustomDesignNotificationRepository notificationRepository
    ) {
        this.openAiWebClient = openAiWebClient;
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.pricingService = pricingService;
        this.customDesignRequestRepository = customDesignRequestRepository;
        this.notificationRepository = notificationRepository;
    }

    public Mono<DesignTurnResponse> nextTurn(String userId, DesignTurnRequest request) {
        if (!properties.enabled()) {
            return Mono.just(applyPricing(fallbackTurn(request)));
        }

        Map<String, Object> body = Map.of(
                "model", properties.model(),
                "input", buildDesignPrompt(request),
                "reasoning", Map.of("effort", "low"),
                "max_output_tokens", 2500,
                "text", Map.of(
                        "format", Map.of(
                                "type", "json_schema",
                                "name", "artisan_design_response",
                                "strict", true,
                                "schema", designSchema()
                        )
                )
        );

        return openAiWebClient.post()
                .uri("/responses")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(70))
                .map(this::parseDesignResponse)
                .map(this::applyPricing)
                .onErrorResume(error -> Mono.just(applyPricing(fallbackTurn(request))));
    }

    public Mono<PreviewResponse> generatePreview(String userId, DesignSpec spec) {
        String prompt = buildPreviewPrompt(spec);
        if (!properties.enabled()) {
            return Mono.just(new PreviewResponse(null, null, prompt, "fallback"));
        }

        Map<String, Object> body = Map.of(
                "model", properties.imageModel(),
                "prompt", prompt,
                "size", "1024x1024",
                "quality", "medium"
        );

        return openAiWebClient.post()
                .uri("/images/generations")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(40))
                .map(node -> {
                    JsonNode first = node.path("data").isArray() && node.path("data").size() > 0
                            ? node.path("data").get(0)
                            : null;
                    String b64 = first == null ? null : first.path("b64_json").asText(null);
                    return new PreviewResponse(b64, b64 == null ? null : "image/png", prompt, "openai");
                })
                .onErrorResume(error -> Mono.just(new PreviewResponse(null, null, prompt, "fallback")));
    }

    public Mono<CustomDesignResponse> confirmDesign(String userId, ConfirmDesignRequest request) {
        UUID parsedUserId = parseUserId(userId);
        DesignSpec pricedSpec = pricingService.applyPricing(request.spec());
        CustomDesignRequest entity = new CustomDesignRequest();
        LocalDateTime now = LocalDateTime.now();
        entity.setId(UUID.randomUUID());
        entity.markNew();
        entity.setUserId(parsedUserId);
        entity.setTitle(pricedSpec.title());
        entity.setProductType(pricedSpec.productType());
        entity.setStatus("PENDING_QUOTE");
        entity.setSpecJson(writeJson(pricedSpec));
        entity.setPriceBreakdownJson(writeJson(pricedSpec.priceBreakdown()));
        entity.setEstimatedPrice(pricedSpec.estimatedPrice());
        entity.setEstimatedDays(pricedSpec.estimatedDays());
        entity.setCustomerNotes(request.customerNotes());
        entity.setReviewNotes(null);
        entity.setPreviewPrompt(blankToNull(request.previewPrompt()));
        entity.setPreviewImageBase64(stripDataUrlPrefix(request.previewImageBase64()));
        entity.setPreviewMimeType(blankToNull(request.previewMimeType()));
        entity.setPreviewSource(blankToNull(request.previewSource()));
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return customDesignRequestRepository.save(entity).map(this::toResponse);
    }

    public Flux<CustomDesignResponse> myDesigns(String userId) {
        return customDesignRequestRepository.findByUserIdOrderByCreatedAtDesc(parseUserId(userId))
                .map(this::toResponse);
    }

    public Flux<CustomDesignResponse> reviewQueue() {
        return customDesignRequestRepository.findAll()
                .sort(Comparator.comparing(
                        CustomDesignRequest::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ).reversed())
                .map(this::toResponse);
    }

    public Mono<CustomDesignResponse> getDesign(UUID id, String userId, String role) {
        UUID parsedUserId = parseUserId(userId);
        return customDesignRequestRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)))
                .flatMap(entity -> {
                    boolean canReview = "ADMIN".equals(role) || "ARTESANO".equals(role);
                    if (!canReview && !entity.getUserId().equals(parsedUserId)) {
                        return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
                    }
                    return Mono.just(entity);
                })
                .map(this::toResponse);
    }

    public Mono<CustomDesignResponse> updateStatus(UUID id, String status, String reviewNotes) {
        String normalizedStatus = normalizeStatus(status);
        return customDesignRequestRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)))
                .flatMap(entity -> {
                    String previousStatus = entity.getStatus();
                    String previousNotes = entity.getReviewNotes();
                    entity.setStatus(normalizedStatus);
                    entity.setReviewNotes(reviewNotes);
                    entity.setUpdatedAt(LocalDateTime.now());
                    return customDesignRequestRepository.save(entity)
                            .flatMap(saved -> maybeNotifyCustomer(saved, previousStatus, previousNotes).thenReturn(saved));
                })
                .map(this::toResponse);
    }

    public Flux<DesignNotificationResponse> notifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(parseUserId(userId))
                .map(this::toNotificationResponse);
    }

    public Mono<Long> unreadNotificationCount(String userId) {
        return notificationRepository.countByUserIdAndReadAtIsNull(parseUserId(userId));
    }

    public Mono<DesignNotificationResponse> markNotificationRead(UUID id, String userId) {
        UUID parsedUserId = parseUserId(userId);
        return notificationRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)))
                .flatMap(notification -> {
                    if (!notification.getUserId().equals(parsedUserId)) {
                        return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
                    }
                    if (notification.getReadAt() == null) {
                        notification.setReadAt(LocalDateTime.now());
                    }
                    return notificationRepository.save(notification);
                })
                .map(this::toNotificationResponse);
    }

    public Mono<Void> markAllNotificationsRead(String userId) {
        LocalDateTime now = LocalDateTime.now();
        return notificationRepository.findByUserIdAndReadAtIsNull(parseUserId(userId))
                .flatMap(notification -> {
                    notification.setReadAt(now);
                    return notificationRepository.save(notification);
                })
                .then();
    }

    private String buildDesignPrompt(DesignTurnRequest request) {
        String currentSpec = "{}";
        if (request.currentSpec() != null) {
            try {
                currentSpec = objectMapper.writeValueAsString(request.currentSpec());
            } catch (JsonProcessingException ignored) {
                currentSpec = "{}";
            }
        }

        return """
                Eres el Agente Diseñador 3D de Rebecca, una tienda premium de artesanias del Eje Cafetero colombiano.
                Convierte deseos del cliente en una propuesta fabricable por artesanos locales y en parametros para un preview 3D parametrico.

                Reglas:
                - Responde solo JSON valido segun el schema.
                - Mantén tono calido, colombiano neutro, sin emojis.
                - Diseña piezas posibles: lampara, vasija, canasto, bandeja, matera, mural, joya, centro de mesa.
                - Usa materiales coherentes: guadua, barro, fique, iraca, madera, lana, ceramica.
                - Usa paleta Rebecca: #704A2E, #C9A253, #F5F0E8, #8A9A7B, #A88696.
                - Si faltan detalles, infiere una propuesta inicial y sugiere ajustes, no bloquees.
                - No prometas fabricación automática; esto crea una solicitud de diseño para cotización.

                Estado actual de la propuesta:
                %s

                Mensaje del cliente:
                %s
                """.formatted(currentSpec, request.message());
    }

    private DesignTurnResponse parseDesignResponse(JsonNode response) {
        String output = extractOutputText(response);
        if (output == null || output.isBlank()) {
            throw new IllegalStateException("OpenAI response did not include output text");
        }
        try {
            DesignTurnResponse parsed = objectMapper.readValue(output, DesignTurnResponse.class);
            return new DesignTurnResponse(parsed.reply(), parsed.spec(), parsed.previewPrompt(), "openai");
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("OpenAI response JSON did not match design response", e);
        }
    }

    private String extractOutputText(JsonNode response) {
        JsonNode output = response.path("output");
        if (output.isArray()) {
            for (JsonNode item : output) {
                JsonNode content = item.path("content");
                if (!content.isArray()) continue;
                for (JsonNode part : content) {
                    String type = part.path("type").asText("");
                    if ("output_text".equals(type) || "text".equals(type)) {
                        String text = part.path("text").asText(null);
                        if (text != null && !text.isBlank()) return text;
                    }
                }
            }
        }
        String direct = response.path("output_text").asText(null);
        return direct == null || direct.isBlank() ? null : direct;
    }

    private DesignTurnResponse applyPricing(DesignTurnResponse response) {
        DesignSpec pricedSpec = pricingService.applyPricing(response.spec());
        return new DesignTurnResponse(
                response.reply(),
                pricedSpec,
                buildPreviewPrompt(pricedSpec),
                response.source()
        );
    }

    private CustomDesignResponse toResponse(CustomDesignRequest entity) {
        DesignSpec spec = readJson(entity.getSpecJson(), DesignSpec.class);
        PriceBreakdown priceBreakdown = readJson(entity.getPriceBreakdownJson(), PriceBreakdown.class);
        return new CustomDesignResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getTitle(),
                entity.getProductType(),
                entity.getStatus(),
                spec,
                priceBreakdown,
                entity.getEstimatedPrice(),
                entity.getEstimatedDays(),
                entity.getCustomerNotes(),
                entity.getReviewNotes(),
                entity.getPreviewPrompt(),
                entity.getPreviewImageBase64(),
                entity.getPreviewMimeType(),
                entity.getPreviewSource(),
                entity.getCreatedAt()
        );
    }

    private String normalizeStatus(String status) {
        String value = status == null ? "" : status.trim().toUpperCase();
        return switch (value) {
            case "PENDING_QUOTE", "IN_REVIEW", "QUOTE_SENT", "CUSTOMER_ACCEPTED", "IN_PRODUCTION", "READY",
                 "NEEDS_CHANGES", "APPROVED_FOR_PRODUCT", "REJECTED", "CANCELLED", "ARCHIVED" -> value;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid custom design status");
        };
    }

    private Mono<Void> maybeNotifyCustomer(CustomDesignRequest design, String previousStatus, String previousNotes) {
        boolean statusChanged = !safeEquals(previousStatus, design.getStatus());
        boolean notesChanged = !safeEquals(previousNotes, design.getReviewNotes());
        if (!statusChanged && !notesChanged) {
            return Mono.empty();
        }

        CustomDesignNotification notification = new CustomDesignNotification();
        notification.setId(UUID.randomUUID());
        notification.markNew();
        notification.setUserId(design.getUserId());
        notification.setDesignId(design.getId());
        notification.setTitle(design.getTitle());
        notification.setStatus(design.getStatus());
        notification.setMessage(notificationMessage(design.getStatus(), design.getReviewNotes()));
        notification.setReadAt(null);
        notification.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(notification).then();
    }

    private DesignNotificationResponse toNotificationResponse(CustomDesignNotification notification) {
        return new DesignNotificationResponse(
                notification.getId(),
                notification.getUserId(),
                notification.getDesignId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getStatus(),
                notification.getReadAt() != null,
                notification.getReadAt(),
                notification.getCreatedAt()
        );
    }

    private String notificationMessage(String status, String reviewNotes) {
        String base = switch (status) {
            case "QUOTE_SENT" -> "El taller envio una cotizacion para tu diseno.";
            case "CUSTOMER_ACCEPTED" -> "Tu encargo fue marcado como aceptado.";
            case "IN_PRODUCTION" -> "Tu pieza personalizada entro a produccion.";
            case "READY" -> "Tu pieza personalizada esta lista.";
            case "NEEDS_CHANGES" -> "El taller necesita ajustes para continuar.";
            case "APPROVED_FOR_PRODUCT" -> "El taller aprobo tu diseno para convertirlo en producto.";
            case "REJECTED" -> "El taller marco este diseno como no viable.";
            case "CANCELLED" -> "Este encargo personalizado fue cancelado.";
            case "ARCHIVED" -> "Este diseno fue archivado.";
            default -> "El taller actualizo el estado de tu diseno.";
        };
        if (reviewNotes == null || reviewNotes.isBlank()) return base;
        return base + " Respuesta del taller: " + reviewNotes.trim();
    }

    private boolean safeEquals(String first, String second) {
        return first == null ? second == null : first.equals(second);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String stripDataUrlPrefix(String value) {
        String clean = blankToNull(value);
        if (clean == null) return null;
        int comma = clean.indexOf(',');
        return clean.startsWith("data:") && comma >= 0 ? clean.substring(comma + 1) : clean;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialize custom design request", e);
        }
    }

    private <T> T readJson(String json, Class<T> type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not read custom design request", e);
        }
    }

    private UUID parseUserId(String userId) {
        try {
            return UUID.fromString(userId);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("X-User-Id must be a UUID", e);
        }
    }

    private DesignTurnResponse fallbackTurn(DesignTurnRequest request) {
        String message = request.message().toLowerCase();
        String type = pickType(message);
        String material = pickMaterial(message, type);
        String title = switch (type) {
            case "lamp" -> "Lampara de guadua con neblina cafetera";
            case "basket" -> "Canasto tejido para mesa de bienvenida";
            case "planter" -> "Matera artesanal de barro y guadua";
            case "jewelry" -> "Collar artesanal de filamento dorado";
            case "tray" -> "Bandeja cafetera de madera y fique";
            default -> "Vasija territorial de barro quemado";
        };

        DesignSpec spec = new DesignSpec(
                type,
                title,
                "Una pieza pensada como encargo personal: nace del paisaje cafetero, mezcla oficio manual y una silueta contemporanea para llevar territorio a casa.",
                message.contains("salento") ? "Salento, Quindio" : "Filandia, Quindio",
                material,
                List.of("fique", "madera sellada", "filamento dorado"),
                REBECCA_PALETTE,
                new DesignSpec.Dimensions(35, 22, 22, 18),
                message.contains("cafe") || message.contains("cafetal") ? "cafetal_neblina" : "guadua_tramada",
                "mate artesanal",
                "media",
                BigDecimal.ZERO,
                null,
                0,
                List.of(
                        "Validar medidas y uso esperado con el cliente.",
                        "Seleccionar material principal y preparar corte/secado.",
                        "Construir forma base segun plantilla 3D.",
                        "Aplicar patron y acabado mate.",
                        "Revisar estabilidad, empaque y entrega."
                ),
                new DesignSpec.ThreeDParameters(
                        type,
                        type.equals("lamp") ? 1.25 : 1.0,
                        type.equals("jewelry") ? 0.38 : 0.62,
                        0.18,
                        0.22,
                        "#704A2E",
                        "#C9A253",
                        message.contains("cafe") ? "cafetal_neblina" : "guadua_tramada",
                        8
                )
        );

        String reply = "Te propongo una base inicial: " + title
                + ". La pense en " + material
                + ", con acabado mate y detalles inspirados en "
                + spec.territory()
                + ". Puedes pedirme que sea mas alta, mas sobria, mas colorida o mas cercana a un objeto funcional.";

        return new DesignTurnResponse(reply, spec, buildPreviewPrompt(spec), "fallback");
    }

    private String pickType(String message) {
        if (message.contains("lampara") || message.contains("lámpara") || message.contains("luz")) return "lamp";
        if (message.contains("canasto") || message.contains("cesto")) return "basket";
        if (message.contains("matera") || message.contains("planta")) return "planter";
        if (message.contains("collar") || message.contains("arete") || message.contains("joya")) return "jewelry";
        if (message.contains("bandeja")) return "tray";
        return "vase";
    }

    private String pickMaterial(String message, String type) {
        if (message.contains("guadua")) return "guadua";
        if (message.contains("barro") || message.contains("ceram")) return "barro";
        if (message.contains("fique") || message.contains("iraca")) return "fique";
        if (message.contains("madera")) return "madera";
        return switch (type) {
            case "lamp" -> "guadua";
            case "basket" -> "fique";
            case "jewelry" -> "madera y filamento dorado";
            default -> "barro";
        };
    }

    private String buildPreviewPrompt(DesignSpec spec) {
        return """
                Product design render, premium Colombian artisan craft from the Coffee Region.
                Object: %s. Material: %s. Pattern: %s. Finish: %s.
                Palette: %s. Territory inspiration: %s.
                Warm cream studio background, soft coffee shadows, handcrafted imperfections, elegant catalog lighting.
                No people, no text, no logo, single object centered, inspectable product preview.
                """.formatted(
                spec.title(),
                spec.primaryMaterial(),
                spec.pattern(),
                spec.finish(),
                spec.colorPalette(),
                spec.territory()
        );
    }

    private Map<String, Object> designSchema() {
        Map<String, Object> stringArray = Map.of("type", "array", "items", Map.of("type", "string"));
        Map<String, Object> dimensions = Map.of(
                "type", "object",
                "additionalProperties", false,
                "properties", Map.of(
                        "heightCm", Map.of("type", "integer"),
                        "widthCm", Map.of("type", "integer"),
                        "depthCm", Map.of("type", "integer"),
                        "diameterCm", Map.of("type", "integer")
                ),
                "required", List.of("heightCm", "widthCm", "depthCm", "diameterCm")
        );
        Map<String, Object> threeD = Map.of(
                "type", "object",
                "additionalProperties", false,
                "properties", Map.of(
                        "template", Map.of("type", "string"),
                        "height", Map.of("type", "number"),
                        "radius", Map.of("type", "number"),
                        "taper", Map.of("type", "number"),
                        "curvature", Map.of("type", "number"),
                        "materialColor", Map.of("type", "string"),
                        "accentColor", Map.of("type", "string"),
                        "patternStyle", Map.of("type", "string"),
                        "repeatCount", Map.of("type", "integer")
                ),
                "required", List.of("template", "height", "radius", "taper", "curvature", "materialColor", "accentColor", "patternStyle", "repeatCount")
        );
        Map<String, Object> priceBreakdown = Map.of(
                "type", "object",
                "additionalProperties", false,
                "properties", Map.of(
                        "basePrice", Map.of("type", "number"),
                        "materialCost", Map.of("type", "number"),
                        "complexityCost", Map.of("type", "number"),
                        "sizeCost", Map.of("type", "number"),
                        "finishCost", Map.of("type", "number"),
                        "total", Map.of("type", "number"),
                        "pricingNotes", stringArray
                ),
                "required", List.of("basePrice", "materialCost", "complexityCost", "sizeCost", "finishCost", "total", "pricingNotes")
        );
        Map<String, Object> spec = Map.of(
                "type", "object",
                "additionalProperties", false,
                "properties", Map.ofEntries(
                        Map.entry("productType", Map.of("type", "string")),
                        Map.entry("title", Map.of("type", "string")),
                        Map.entry("artisanStory", Map.of("type", "string")),
                        Map.entry("territory", Map.of("type", "string")),
                        Map.entry("primaryMaterial", Map.of("type", "string")),
                        Map.entry("secondaryMaterials", stringArray),
                        Map.entry("colorPalette", stringArray),
                        Map.entry("dimensions", dimensions),
                        Map.entry("pattern", Map.of("type", "string")),
                        Map.entry("finish", Map.of("type", "string")),
                        Map.entry("complexity", Map.of("type", "string")),
                        Map.entry("estimatedPrice", Map.of("type", "number")),
                        Map.entry("priceBreakdown", priceBreakdown),
                        Map.entry("estimatedDays", Map.of("type", "integer")),
                        Map.entry("makingSteps", stringArray),
                        Map.entry("threeD", threeD)
                ),
                "required", List.of("productType", "title", "artisanStory", "territory", "primaryMaterial", "secondaryMaterials", "colorPalette", "dimensions", "pattern", "finish", "complexity", "estimatedPrice", "priceBreakdown", "estimatedDays", "makingSteps", "threeD")
        );
        return Map.of(
                "type", "object",
                "additionalProperties", false,
                "properties", Map.of(
                        "reply", Map.of("type", "string"),
                        "spec", spec,
                        "previewPrompt", Map.of("type", "string"),
                        "source", Map.of("type", "string")
                ),
                "required", List.of("reply", "spec", "previewPrompt", "source")
        );
    }
}
