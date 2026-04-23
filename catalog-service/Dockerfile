# ---- Build stage ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

RUN apt-get update && apt-get install -y --no-install-recommends maven && rm -rf /var/lib/apt/lists/*

COPY pom.xml /workspace/pom.xml
COPY discovery-server/pom.xml /workspace/discovery-server/pom.xml
COPY api-gateway/pom.xml /workspace/api-gateway/pom.xml
COPY auth-service/pom.xml /workspace/auth-service/pom.xml
COPY catalog-service/pom.xml /workspace/catalog-service/pom.xml
COPY inventory-service/pom.xml /workspace/inventory-service/pom.xml
COPY report-service/pom.xml /workspace/report-service/pom.xml

RUN mvn -f /workspace/catalog-service/pom.xml dependency:go-offline -DskipTests 2>/dev/null || true

COPY catalog-service/src /workspace/catalog-service/src

RUN mvn -f /workspace/catalog-service/pom.xml package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=build /workspace/catalog-service/target/*.jar app.jar
RUN chown spring:spring app.jar
USER spring
EXPOSE 8082
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
