# ---- Build stage ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

RUN apt-get update && apt-get install -y --no-install-recommends maven && rm -rf /var/lib/apt/lists/*

COPY pom.xml /workspace/pom.xml
COPY inventory-service/pom.xml /workspace/inventory-service/pom.xml

RUN mvn -f /workspace/pom.xml -pl inventory-service -am dependency:go-offline -DskipTests 2>/dev/null || true

COPY inventory-service/src /workspace/inventory-service/src

RUN mvn -f /workspace/pom.xml -pl inventory-service -am package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=build /workspace/inventory-service/target/*.jar app.jar
RUN chown spring:spring app.jar
USER spring
EXPOSE 8083
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
