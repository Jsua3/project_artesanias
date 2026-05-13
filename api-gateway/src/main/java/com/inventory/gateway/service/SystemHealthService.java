package com.inventory.gateway.service;

import com.inventory.gateway.config.JwtProperties;
import com.inventory.gateway.dto.IntegrationStatusResponse;
import com.inventory.gateway.dto.ReleaseCheckResponse;
import com.inventory.gateway.dto.ServiceProbeResponse;
import com.inventory.gateway.dto.SystemHealthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SystemHealthService {

    private static final Duration PROBE_TIMEOUT = Duration.ofSeconds(4);

    private final WebClient webClient;
    private final JwtProperties jwtProperties;
    private final String authServiceUrl;
    private final String catalogServiceUrl;
    private final String inventoryServiceUrl;
    private final String reportServiceUrl;
    private final String aiServiceUrl;
    private final String frontendUrl;

    public SystemHealthService(
            WebClient.Builder webClientBuilder,
            JwtProperties jwtProperties,
            @Value("${AUTH_SERVICE_URL:http://localhost:8081}") String authServiceUrl,
            @Value("${CATALOG_SERVICE_URL:http://localhost:8082}") String catalogServiceUrl,
            @Value("${INVENTORY_SERVICE_URL:http://localhost:8083}") String inventoryServiceUrl,
            @Value("${REPORT_SERVICE_URL:http://localhost:8084}") String reportServiceUrl,
            @Value("${AI_SERVICE_URL:http://localhost:8085}") String aiServiceUrl,
            @Value("${FRONTEND_URL:http://frontend}") String frontendUrl
    ) {
        this.webClient = webClientBuilder.build();
        this.jwtProperties = jwtProperties;
        this.authServiceUrl = stripTrailingSlash(authServiceUrl);
        this.catalogServiceUrl = stripTrailingSlash(catalogServiceUrl);
        this.inventoryServiceUrl = stripTrailingSlash(inventoryServiceUrl);
        this.reportServiceUrl = stripTrailingSlash(reportServiceUrl);
        this.aiServiceUrl = stripTrailingSlash(aiServiceUrl);
        this.frontendUrl = stripTrailingSlash(frontendUrl);
    }

    public Mono<SystemHealthResponse> snapshot() {
        List<Mono<ServiceProbeResponse>> probeCalls = List.of(
                probe("frontend", "web", frontendUrl + "/"),
                probe("api-gateway", "gateway", "http://localhost:8080/actuator/health"),
                probe("auth-service", "service", authServiceUrl + "/actuator/health"),
                probe("catalog-service", "service", catalogServiceUrl + "/actuator/health"),
                probe("inventory-service", "service", inventoryServiceUrl + "/actuator/health"),
                probe("report-service", "service", reportServiceUrl + "/actuator/health"),
                probe("ai-service", "service", aiServiceUrl + "/actuator/health")
        );

        Mono<IntegrationStatusResponse> openAi = integration(
                "OpenAI",
                aiServiceUrl + "/api/ai/admin/config-status",
                "OpenAI no esta configurado; el disenador usara fallback local."
        );
        Mono<IntegrationStatusResponse> stripe = integration(
                "Stripe",
                inventoryServiceUrl + "/api/ventas/admin/payment-status",
                "Stripe no esta configurado; checkout devolvera 503."
        );

        return Mono.zip(
                Mono.zip(probeCalls, values -> List.of(
                        (ServiceProbeResponse) values[0],
                        (ServiceProbeResponse) values[1],
                        (ServiceProbeResponse) values[2],
                        (ServiceProbeResponse) values[3],
                        (ServiceProbeResponse) values[4],
                        (ServiceProbeResponse) values[5],
                        (ServiceProbeResponse) values[6]
                )),
                Mono.zip(openAi, stripe, (a, s) -> List.of(a, s)),
                (services, integrations) -> {
                    String overall = overallStatus(services, integrations);
                    return new SystemHealthResponse(
                            overall,
                            Instant.now(),
                            implementationVersion(),
                            services,
                            integrations,
                            checklist(services, integrations)
                    );
                }
        );
    }

    private Mono<ServiceProbeResponse> probe(String name, String kind, String url) {
        long start = System.nanoTime();
        return webClient.get()
                .uri(url)
                .exchangeToMono(response -> response.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .map(body -> {
                            int code = response.statusCode().value();
                            boolean healthy = response.statusCode().is2xxSuccessful()
                                    && ("web".equals(kind) || body.isBlank() || body.contains("\"UP\"") || body.contains("UP"));
                            return new ServiceProbeResponse(
                                    name,
                                    kind,
                                    url,
                                    healthy ? "UP" : "WARN",
                                    code,
                                    elapsedMs(start),
                                    Instant.now(),
                                    healthy ? "Disponible" : "Respuesta inesperada"
                            );
                        }))
                .timeout(PROBE_TIMEOUT)
                .onErrorResume(error -> Mono.just(new ServiceProbeResponse(
                        name,
                        kind,
                        url,
                        "DOWN",
                        null,
                        elapsedMs(start),
                        Instant.now(),
                        shortError(error)
                )));
    }

    @SuppressWarnings("unchecked")
    private Mono<IntegrationStatusResponse> integration(String name, String url, String missingDetail) {
        return webClient.get()
                .uri(url)
                .header("X-Internal-Token", jwtProperties.internalToken())
                .header("X-User-Role", "ADMIN")
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(PROBE_TIMEOUT)
                .map(raw -> {
                    Map<String, Object> body = new LinkedHashMap<>((Map<String, Object>) raw);
                    boolean configured = Boolean.TRUE.equals(body.get("configured"));
                    Map<String, Object> metadata = new LinkedHashMap<>(body);
                    metadata.remove("configured");
                    metadata.remove("status");
                    metadata.remove("detail");
                    return new IntegrationStatusResponse(
                            name,
                            configured,
                            configured ? "READY" : "WARN",
                            configured ? String.valueOf(body.getOrDefault("detail", "Configurado")) : missingDetail,
                            metadata
                    );
                })
                .onErrorResume(error -> Mono.just(new IntegrationStatusResponse(
                        name,
                        false,
                        "DOWN",
                        shortError(error),
                        Map.of()
                )));
    }

    private String overallStatus(List<ServiceProbeResponse> services, List<IntegrationStatusResponse> integrations) {
        boolean criticalDown = services.stream()
                .filter(service -> !"frontend".equals(service.name()))
                .anyMatch(service -> "DOWN".equals(service.status()));
        if (criticalDown) {
            return "BLOCKED";
        }
        boolean warnings = services.stream().anyMatch(service -> !"UP".equals(service.status()))
                || integrations.stream().anyMatch(integration -> !"READY".equals(integration.status()));
        return warnings ? "WARN" : "READY";
    }

    private List<ReleaseCheckResponse> checklist(
            List<ServiceProbeResponse> services,
            List<IntegrationStatusResponse> integrations
    ) {
        boolean allServicesUp = services.stream().allMatch(service -> "UP".equals(service.status()));
        boolean openAiReady = integrationReady(integrations, "OpenAI");
        boolean stripeReady = integrationReady(integrations, "Stripe");
        boolean noBlocked = services.stream()
                .filter(service -> !"frontend".equals(service.name()))
                .noneMatch(service -> "DOWN".equals(service.status()));

        return List.of(
                check("services", "Servicios principales responden", allServicesUp ? "PASS" : "FAIL",
                        allServicesUp ? "Todos los probes respondieron correctamente." : "Hay servicios caidos o con respuesta inesperada."),
                check("openai", "OpenAI configurado", openAiReady ? "PASS" : "WARN",
                        openAiReady ? "El agente IA puede usar OpenAI." : "La app funciona con fallback local, pero preview IA real no queda listo."),
                check("stripe", "Stripe configurado", stripeReady ? "PASS" : "WARN",
                        stripeReady ? "Checkout puede crear sesiones de pago." : "Checkout queda deshabilitado hasta configurar Stripe."),
                check("deploy", "Semaforo de despliegue", noBlocked ? "PASS" : "FAIL",
                        noBlocked ? "No hay bloqueo tecnico evidente desde healthchecks." : "No desplegar hasta recuperar servicios criticos.")
        );
    }

    private ReleaseCheckResponse check(String id, String label, String status, String detail) {
        return new ReleaseCheckResponse(id, label, status, detail);
    }

    private boolean integrationReady(List<IntegrationStatusResponse> integrations, String name) {
        return integrations.stream()
                .anyMatch(integration -> name.equals(integration.name()) && integration.configured());
    }

    private long elapsedMs(long start) {
        return Duration.ofNanos(System.nanoTime() - start).toMillis();
    }

    private String implementationVersion() {
        String version = SystemHealthService.class.getPackage().getImplementationVersion();
        return version == null || version.isBlank() ? "1.0.0-local" : version;
    }

    private String shortError(Throwable error) {
        String message = error.getMessage();
        if (message == null || message.isBlank()) {
            message = error.getClass().getSimpleName();
        }
        return message.length() > 160 ? message.substring(0, 157) + "..." : message;
    }

    private String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
