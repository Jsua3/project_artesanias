# ---- Build stage ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

RUN apt-get update && apt-get install -y --no-install-recommends maven && rm -rf /var/lib/apt/lists/*

COPY pom.xml /workspace/pom.xml
COPY api-gateway/pom.xml /workspace/api-gateway/pom.xml

RUN mvn -f /workspace/pom.xml -pl api-gateway -am dependency:go-offline -DskipTests 2>/dev/null || true

COPY api-gateway/src /workspace/api-gateway/src

RUN mvn -f /workspace/pom.xml -pl api-gateway -am package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=build /workspace/api-gateway/target/*.jar app.jar
RUN chown spring:spring app.jar
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
