package com.inventory.gateway;

import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class RouteSecurityContractTest {

    private static final Set<String> EXPECTED_PUBLIC_ROUTES = Set.of(
            "auth-service-public",
            "catalog-service-public-eventos",
            "catalog-service-public",
            "inventory-service-stripe-webhook",
            "ai-service-public-design"
    );

    private static final Set<String> SENSITIVE_ROUTES = Set.of(
            "auth-service-private",
            "catalog-service-admin-db",
            "auth-service-admin-db",
            "inventory-service-admin-db",
            "catalog-service-management",
            "catalog-service-community",
            "catalog-service-private",
            "inventory-service",
            "report-service",
            "ai-service"
    );

    private static final Set<String> PUBLIC_AI_PATHS = Set.of(
            "/api/ai/design/message",
            "/api/ai/design/preview"
    );

    @Test
    void everySensitiveRouteRequiresJwtAuth() throws IOException {
        Map<String, Route> routes = loadRoutes();

        assertThat(routes.keySet()).containsAll(SENSITIVE_ROUTES);
        for (String id : SENSITIVE_ROUTES) {
            assertThat(routes.get(id).filters())
                    .as("route %s must be protected by JwtAuth", id)
                    .contains("JwtAuth");
        }
    }

    @Test
    void publicRoutesAreExplicitAndLimited() throws IOException {
        Map<String, Route> routes = loadRoutes();

        List<String> publicRoutes = routes.values().stream()
                .filter(route -> !route.filters().contains("JwtAuth"))
                .map(Route::id)
                .toList();

        assertThat(publicRoutes).containsExactlyInAnyOrderElementsOf(EXPECTED_PUBLIC_ROUTES);
    }

    @Test
    void catalogAdminRoutesAreMatchedBeforePublicWildcard() throws IOException {
        List<Route> routes = loadRoutesInOrder();

        int managementIndex = indexOf(routes, "catalog-service-management");
        int publicIndex = indexOf(routes, "catalog-service-public");

        assertThat(managementIndex).isLessThan(publicIndex);
        assertThat(routes.get(managementIndex).predicates())
                .anyMatch(predicate -> predicate.contains("/api/products/admin/**")
                        && predicate.contains("/api/artesanos/admin/**"));
    }

    @Test
    void publicAiRouteOnlyExposesDesignerMessageAndPreview() throws IOException {
        Map<String, Route> routes = loadRoutes();
        Route route = routes.get("ai-service-public-design");

        assertThat(route.filters()).doesNotContain("JwtAuth");
        assertThat(route.filters()).anyMatch(filter -> filter.startsWith("AddRequestHeader=X-Internal-Token"));
        assertThat(route.predicates()).anyMatch(predicate ->
                PUBLIC_AI_PATHS.stream().allMatch(predicate::contains)
                        && !predicate.contains("/api/ai/**")
                        && !predicate.contains("/api/ai/design/confirm")
                        && !predicate.contains("/api/ai/design/review"));
        assertThat(route.predicates()).contains("Method=POST");
    }

    @Test
    void publicAiRouteIsMatchedBeforePrivateAiWildcard() throws IOException {
        List<Route> routes = loadRoutesInOrder();

        assertThat(indexOf(routes, "ai-service-public-design")).isLessThan(indexOf(routes, "ai-service"));
    }

    @SuppressWarnings("unchecked")
    private List<Route> loadRoutesInOrder() throws IOException {
        try (InputStream input = getClass().getResourceAsStream("/application.yml")) {
            Map<String, Object> yaml = new Yaml().load(input);
            Map<String, Object> spring = (Map<String, Object>) yaml.get("spring");
            Map<String, Object> cloud = (Map<String, Object>) spring.get("cloud");
            Map<String, Object> gateway = (Map<String, Object>) cloud.get("gateway");
            List<Map<String, Object>> routeMaps = (List<Map<String, Object>>) gateway.get("routes");

            return routeMaps.stream()
                    .map(route -> new Route(
                            (String) route.get("id"),
                            stringList(route.get("predicates")),
                            stringList(route.get("filters"))))
                    .toList();
        }
    }

    private Map<String, Route> loadRoutes() throws IOException {
        return loadRoutesInOrder().stream()
                .collect(Collectors.toMap(Route::id, route -> route));
    }

    private int indexOf(List<Route> routes, String id) {
        for (int i = 0; i < routes.size(); i++) {
            if (routes.get(i).id().equals(id)) {
                return i;
            }
        }
        return -1;
    }

    @SuppressWarnings("unchecked")
    private static List<String> stringList(Object value) {
        if (value == null) {
            return List.of();
        }
        return (List<String>) value;
    }

    private record Route(String id, List<String> predicates, List<String> filters) {}
}
