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
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
                Convierte deseos del cliente en una propuesta fabricable por artesanos locales y en parametros para una escena 3D real en Three.js.

                Reglas:
                - Responde solo JSON valido segun el schema.
                - Mantén tono calido, colombiano neutro, sin emojis.
                - Diseña piezas posibles: lampara, vasija, canasto, bandeja, matera, mural, joya, centro de mesa.
                - Usa materiales coherentes: guadua, barro, fique, iraca, madera, lana, ceramica.
                - Usa paleta Rebecca: #704A2E, #C9A253, #F5F0E8, #8A9A7B, #A88696.
                - En threeD.template usa preferiblemente: lamp, vase, tray o planter; si el cliente pide canasto usa basket.
                - En threeD.materialPreset usa: guadua, barro, fique, iraca, madera, ceramica o lana.
                - En threeD.surfaceTexture usa: fibra, veta, barro, tejido, liso o esmaltado.
                - En threeD.ornamentStyle usa: aros_circulares, trama_tejida, palma_de_cera, cafetal_neblina, geometria_cafetera o territorio_sutil.
                - En threeD.parts describe modulos visibles: band, handle, leg, rim, weave, perforation, base o shade.
                - Prioriza belleza artesanal observable en 3D: proporciones claras, ornamentos legibles y materiales texturizados.
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
        String message = normalizeText(request.message());
        DesignSpec current = request.currentSpec();
        String type = pickType(message, current);
        String material = pickPrimaryMaterial(message, type);
        String territory = pickTerritory(message, current);
        String pattern = pickPattern(message, type, current);
        String finish = pickFinish(message, current);
        List<String> palette = pickPalette(message, current);
        List<String> secondaryMaterials = pickSecondaryMaterials(message, material, current);
        DesignSpec.Dimensions dimensions = pickDimensions(message, type, current);
        String complexity = pickComplexity(message, pattern, secondaryMaterials, current);
        String title = buildFallbackTitle(type, material, pattern, palette);

        DesignSpec spec = new DesignSpec(
                type,
                title,
                buildArtisanStory(material, territory, pattern),
                territory,
                material,
                secondaryMaterials,
                palette,
                dimensions,
                pattern,
                finish,
                complexity,
                BigDecimal.ZERO,
                null,
                0,
                makingSteps(type, material, pattern, finish),
                new DesignSpec.ThreeDParameters(
                        type,
                        heightParameter(type, dimensions),
                        radiusParameter(type, dimensions),
                        taperParameter(type),
                        curvatureParameter(pattern),
                        palette.get(0),
                        palette.size() > 1 ? palette.get(1) : "#C9A253",
                        pattern,
                        repeatCount(pattern),
                        "v1.2",
                        materialPreset(material),
                        complexity,
                        cameraPreset(type),
                        surfaceTexture(material, pattern),
                        pattern,
                        buildThreeDParts(type, material, pattern, palette)
                )
        );

        String reply = "Te propongo una base inicial: " + title
                + ". La pense en " + material
                + secondaryMaterialsPhrase(secondaryMaterials)
                + ", con acabado " + finish
                + ", patron " + pattern.replace('_', ' ')
                + " y paleta " + palettePhrase(palette)
                + ". El preview 3D queda ajustado a " + dimensions.heightCm() + " x " + dimensions.widthCm()
                + " cm e inspirado en " + territory
                + ". Puedes pedirme cambios de forma, color, material, medidas o presupuesto.";

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

    private String pickType(String message, DesignSpec current) {
        if (message.contains("lampara") || message.contains("luz") || message.contains("pantalla")) return "lamp";
        if (message.contains("canasto") || message.contains("cesto")) return "basket";
        if (message.contains("matera") || message.contains("planta")) return "planter";
        if (message.contains("collar") || message.contains("arete") || message.contains("joya")) return "jewelry";
        if (message.contains("bandeja")) return "tray";
        if (message.contains("mural")) return "mural";
        if (current != null && current.productType() != null && !current.productType().isBlank()) return current.productType();
        return "vase";
    }

    private String pickPrimaryMaterial(String message, String type) {
        if (message.contains("guadua")) return "guadua";
        if (message.contains("bejuco")) return "bejuco";
        if (message.contains("barro") || message.contains("ceram")) return "barro";
        if (message.contains("fique")) return "fique";
        if (message.contains("iraca")) return "iraca";
        if (message.contains("madera")) return "madera";
        if (message.contains("lana")) return "lana";
        return switch (type) {
            case "lamp" -> "guadua";
            case "basket" -> "fique";
            case "jewelry" -> "madera y filamento dorado";
            case "tray" -> "madera";
            default -> "barro";
        };
    }

    private String pickTerritory(String message, DesignSpec current) {
        if (message.contains("salento") || message.contains("cocora")) return "Salento, Quindio";
        if (message.contains("filandia")) return "Filandia, Quindio";
        if (message.contains("pijao")) return "Pijao, Quindio";
        if (message.contains("circasia")) return "Circasia, Quindio";
        if (message.contains("armenia")) return "Armenia, Quindio";
        if (current != null && current.territory() != null && !current.territory().isBlank()) return current.territory();
        return "Filandia, Quindio";
    }

    private String pickPattern(String message, String type, DesignSpec current) {
        if (message.contains("circular") || message.contains("circulo") || message.contains("redondo")) return "aros_circulares";
        if (message.contains("geometr")) return "geometria_cafetera";
        if (message.contains("palma")) return "palma_de_cera";
        if (message.contains("cafetal") || message.contains("cafe")) return "cafetal_neblina";
        if (message.contains("trenz") || message.contains("tejid")) return "trama_tejida";
        if (current != null && current.pattern() != null && !current.pattern().isBlank()) return current.pattern();
        return type.equals("lamp") ? "guadua_tramada" : "territorio_sutil";
    }

    private String pickFinish(String message, DesignSpec current) {
        if (message.contains("brillante") || message.contains("esmalt")) return "brillante artesanal";
        if (message.contains("dorado") || message.contains("metal")) return "mate con acento dorado";
        if (message.contains("tallado") || message.contains("relieve")) return "tallado en bajo relieve";
        if (message.contains("mate")) return "mate artesanal";
        if (current != null && current.finish() != null && !current.finish().isBlank()) return current.finish();
        return "mate artesanal";
    }

    private List<String> pickPalette(String message, DesignSpec current) {
        LinkedHashSet<String> colors = new LinkedHashSet<>();
        if (message.contains("azul")) colors.add("#2F5F8F");
        if (message.contains("rojo")) colors.add("#B84A3A");
        if (message.contains("verde")) colors.add("#5A6B4A");
        if (message.contains("dorado") || message.contains("oro")) colors.add("#C9A253");
        if (message.contains("negro")) colors.add("#2E2620");
        if (message.contains("blanco") || message.contains("crema")) colors.add("#F5F0E8");
        if (message.contains("calido") || message.contains("terracota")) colors.add("#A67C52");
        if (colors.isEmpty() && current != null && current.colorPalette() != null && !current.colorPalette().isEmpty()) {
            colors.addAll(current.colorPalette());
        }
        for (String color : REBECCA_PALETTE) {
            if (colors.size() >= 3) break;
            colors.add(color);
        }
        return new ArrayList<>(colors);
    }

    private List<String> pickSecondaryMaterials(String message, String primaryMaterial, DesignSpec current) {
        LinkedHashSet<String> materials = new LinkedHashSet<>();
        addMaterialIfMentioned(materials, message, "guadua", primaryMaterial);
        addMaterialIfMentioned(materials, message, "bejuco", primaryMaterial);
        addMaterialIfMentioned(materials, message, "barro", primaryMaterial);
        addMaterialIfMentioned(materials, message, "fique", primaryMaterial);
        addMaterialIfMentioned(materials, message, "iraca", primaryMaterial);
        addMaterialIfMentioned(materials, message, "madera", primaryMaterial);
        addMaterialIfMentioned(materials, message, "lana", primaryMaterial);
        if (materials.isEmpty() && current != null && current.secondaryMaterials() != null) {
            materials.addAll(current.secondaryMaterials());
            materials.remove(primaryMaterial);
        }
        if (materials.isEmpty()) {
            if (!"fique".equals(primaryMaterial)) materials.add("fique");
            if (!"madera".equals(primaryMaterial)) materials.add("madera sellada");
        }
        return new ArrayList<>(materials).stream().limit(3).toList();
    }

    private void addMaterialIfMentioned(LinkedHashSet<String> materials, String message, String material, String primaryMaterial) {
        if (message.contains(material) && !material.equals(primaryMaterial)) {
            materials.add(material);
        }
    }

    private DesignSpec.Dimensions pickDimensions(String message, String type, DesignSpec current) {
        Integer mentioned = firstCentimeterValue(message);
        int height = mentioned != null ? mentioned : current != null && current.dimensions() != null ? safeDimension(current.dimensions().heightCm()) : defaultHeight(type);
        int width = switch (type) {
            case "lamp" -> Math.max(18, Math.round(height * 0.48f));
            case "tray" -> Math.max(30, mentioned != null ? Math.round(height * 1.45f) : 42);
            case "jewelry" -> 8;
            default -> Math.max(16, Math.round(height * 0.62f));
        };
        int depth = type.equals("tray") ? Math.max(18, Math.round(width * 0.62f)) : width;
        int diameter = type.equals("lamp") || type.equals("vase") || type.equals("planter") ? width : 0;
        return new DesignSpec.Dimensions(height, width, depth, diameter);
    }

    private Integer firstCentimeterValue(String message) {
        Matcher matcher = Pattern.compile("(\\d{2,3})\\s*(cm|centimetros?)").matcher(message);
        return matcher.find() ? Integer.parseInt(matcher.group(1)) : null;
    }

    private int defaultHeight(String type) {
        return switch (type) {
            case "lamp" -> 35;
            case "tray" -> 28;
            case "jewelry" -> 8;
            case "basket", "planter" -> 24;
            case "mural" -> 45;
            default -> 30;
        };
    }

    private String pickComplexity(String message, String pattern, List<String> secondaryMaterials, DesignSpec current) {
        if (message.contains("simple") || message.contains("sobri")) return "baja";
        if (message.contains("detalle") || message.contains("circular") || message.contains("relieve") || secondaryMaterials.size() > 1) return "alta";
        if (current != null && current.complexity() != null && !current.complexity().isBlank()) return current.complexity();
        return "media";
    }

    private String buildFallbackTitle(String type, String material, String pattern, List<String> palette) {
        String object = switch (type) {
            case "lamp" -> "Lampara";
            case "basket" -> "Canasto";
            case "planter" -> "Matera";
            case "jewelry" -> "Joya";
            case "tray" -> "Bandeja";
            case "mural" -> "Mural";
            default -> "Vasija";
        };
        String accent = pattern.equals("aros_circulares") ? "con aros circulares" : "con " + pattern.replace('_', ' ');
        String color = palette.contains("#2F5F8F") ? "azul" : palette.contains("#B84A3A") ? "roja" : "cafetera";
        return object + " de " + material + " " + color + " " + accent;
    }

    private String buildArtisanStory(String material, String territory, String pattern) {
        return "Pieza personalizada para uso cotidiano y decorativo, pensada en " + material
                + " con patron " + pattern.replace('_', ' ')
                + ". Su forma toma referencias de " + territory
                + " y traduce la solicitud del cliente en una guia fabricable para el taller.";
    }

    private List<String> makingSteps(String type, String material, String pattern, String finish) {
        return List.of(
                "Validar uso, medidas y paleta final con el cliente.",
                "Seleccionar " + material + " y preparar corte, tejido o secado segun tecnica.",
                "Construir la forma base segun plantilla 3D tipo " + type + ".",
                "Aplicar patron " + pattern.replace('_', ' ') + " y acabado " + finish + ".",
                "Revisar estabilidad, cableado si aplica, empaque y entrega."
        );
    }

    private double heightParameter(String type, DesignSpec.Dimensions dimensions) {
        double base = Math.max(0.35, safeDimension(dimensions.heightCm()) / 30.0);
        return type.equals("jewelry") ? 0.38 : Math.min(1.85, base);
    }

    private double radiusParameter(String type, DesignSpec.Dimensions dimensions) {
        if (type.equals("jewelry")) return 0.32;
        return Math.max(0.32, Math.min(0.95, Math.max(safeDimension(dimensions.widthCm()), safeDimension(dimensions.diameterCm())) / 42.0));
    }

    private double taperParameter(String type) {
        return switch (type) {
            case "lamp" -> 0.28;
            case "tray" -> 0.08;
            case "basket" -> 0.16;
            default -> 0.2;
        };
    }

    private double curvatureParameter(String pattern) {
        return pattern.contains("circular") ? 0.34 : pattern.contains("trama") ? 0.26 : 0.2;
    }

    private int repeatCount(String pattern) {
        return pattern.contains("circular") ? 12 : pattern.contains("trama") ? 10 : 7;
    }

    private String materialPreset(String material) {
        String value = normalizeText(material);
        if (value.contains("guadua") || value.contains("bejuco")) return "guadua";
        if (value.contains("barro")) return "barro";
        if (value.contains("fique")) return "fique";
        if (value.contains("iraca")) return "iraca";
        if (value.contains("madera")) return "madera";
        if (value.contains("lana")) return "lana";
        if (value.contains("ceram")) return "ceramica";
        return "barro";
    }

    private String surfaceTexture(String material, String pattern) {
        String preset = materialPreset(material);
        if (pattern != null && pattern.contains("trama")) return "tejido";
        return switch (preset) {
            case "guadua", "fique", "iraca", "lana" -> "fibra";
            case "madera" -> "veta";
            case "ceramica" -> "esmaltado";
            default -> "barro";
        };
    }

    private String cameraPreset(String type) {
        return switch (type) {
            case "tray" -> "top_oblique";
            case "lamp" -> "hero_tall";
            default -> "studio_three_quarter";
        };
    }

    private List<DesignSpec.ThreeDPart> buildThreeDParts(String type, String material, String pattern, List<String> palette) {
        String accent = palette != null && palette.size() > 1 ? palette.get(1) : "#C9A253";
        String base = palette != null && !palette.isEmpty() ? palette.get(0) : "#704A2E";
        List<DesignSpec.ThreeDPart> parts = new ArrayList<>();
        parts.add(new DesignSpec.ThreeDPart("base", "bottom", 1, base, 1.0, 0.0));
        parts.add(new DesignSpec.ThreeDPart("rim", "top", 1, accent, 1.0, 0.0));
        if ("lamp".equals(type)) {
            parts.add(new DesignSpec.ThreeDPart("shade", "top", 1, base, 1.0, 0.0));
            parts.add(new DesignSpec.ThreeDPart("band", "middle", 3, accent, 1.0, 0.0));
            parts.add(new DesignSpec.ThreeDPart("weave", "surface", Math.max(8, repeatCount(pattern)), accent, 0.72, 0.0));
        } else if ("tray".equals(type)) {
            parts.add(new DesignSpec.ThreeDPart("handle", "side", 2, accent, 1.0, 0.0));
            parts.add(new DesignSpec.ThreeDPart("weave", "surface", Math.max(8, repeatCount(pattern)), accent, 0.56, 0.0));
        } else if ("planter".equals(type)) {
            parts.add(new DesignSpec.ThreeDPart("leg", "bottom", 3, accent, 0.82, 0.0));
            parts.add(new DesignSpec.ThreeDPart("band", "middle", 2, accent, 1.0, 0.0));
        } else {
            parts.add(new DesignSpec.ThreeDPart("band", "middle", Math.max(2, repeatCount(pattern) / 4), accent, 1.0, 0.0));
        }
        if (pattern != null && pattern.contains("circular")) {
            parts.add(new DesignSpec.ThreeDPart("perforation", "surface", Math.max(8, repeatCount(pattern)), accent, 0.5, 0.0));
        }
        return parts;
    }

    private int safeDimension(Integer value) {
        return value == null ? 0 : Math.max(0, value);
    }

    private String secondaryMaterialsPhrase(List<String> materials) {
        if (materials == null || materials.isEmpty()) return "";
        return " y apoyo en " + String.join(", ", materials);
    }

    private String palettePhrase(List<String> palette) {
        if (palette.contains("#2F5F8F") && palette.contains("#B84A3A")) return "azul con acentos rojos";
        if (palette.contains("#2F5F8F")) return "azul cafetero";
        if (palette.contains("#B84A3A")) return "rojo terracota";
        return "Rebecca";
    }

    private String normalizeText(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .trim();
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
        Map<String, Object> threeDPart = Map.of(
                "type", "object",
                "additionalProperties", false,
                "properties", Map.of(
                        "kind", Map.of("type", "string", "enum", List.of("band", "handle", "leg", "rim", "weave", "perforation", "base", "shade")),
                        "placement", Map.of("type", "string", "enum", List.of("top", "middle", "bottom", "side", "surface")),
                        "repeatCount", Map.of("type", "integer"),
                        "color", Map.of("type", "string"),
                        "scale", Map.of("type", "number"),
                        "rotation", Map.of("type", "number")
                ),
                "required", List.of("kind", "placement", "repeatCount", "color", "scale", "rotation")
        );
        Map<String, Object> threeD = Map.of(
                "type", "object",
                "additionalProperties", false,
                "properties", Map.ofEntries(
                        Map.entry("template", Map.of("type", "string", "enum", List.of("lamp", "vase", "basket", "tray", "planter", "mural", "jewelry", "centerpiece"))),
                        Map.entry("height", Map.of("type", "number")),
                        Map.entry("radius", Map.of("type", "number")),
                        Map.entry("taper", Map.of("type", "number")),
                        Map.entry("curvature", Map.of("type", "number")),
                        Map.entry("materialColor", Map.of("type", "string")),
                        Map.entry("accentColor", Map.of("type", "string")),
                        Map.entry("patternStyle", Map.of("type", "string")),
                        Map.entry("repeatCount", Map.of("type", "integer")),
                        Map.entry("engineVersion", Map.of("type", "string")),
                        Map.entry("materialPreset", Map.of("type", "string", "enum", List.of("guadua", "barro", "fique", "iraca", "madera", "ceramica", "lana"))),
                        Map.entry("detailLevel", Map.of("type", "string", "enum", List.of("baja", "media", "alta"))),
                        Map.entry("cameraPreset", Map.of("type", "string", "enum", List.of("studio_three_quarter", "hero_tall", "top_oblique"))),
                        Map.entry("surfaceTexture", Map.of("type", "string", "enum", List.of("fibra", "veta", "barro", "tejido", "liso", "esmaltado"))),
                        Map.entry("ornamentStyle", Map.of("type", "string")),
                        Map.entry("parts", Map.of("type", "array", "items", threeDPart))
                ),
                "required", List.of("template", "height", "radius", "taper", "curvature", "materialColor", "accentColor", "patternStyle", "repeatCount", "engineVersion", "materialPreset", "detailLevel", "cameraPreset", "surfaceTexture", "ornamentStyle", "parts")
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
