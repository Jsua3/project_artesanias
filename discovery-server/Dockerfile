# ---- Build stage ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# Install Maven
RUN apt-get update && apt-get install -y --no-install-recommends maven && rm -rf /var/lib/apt/lists/*

# Copy parent POM and install (for dependency resolution)
COPY pom.xml /workspace/pom.xml
COPY discovery-server/pom.xml /workspace/discovery-server/pom.xml

# Pre-download dependencies (cached layer)
RUN mvn -f /workspace/pom.xml -pl discovery-server -am dependency:go-offline -DskipTests 2>/dev/null || true

# Copy source
COPY discovery-server/src /workspace/discovery-server/src

# Build
RUN mvn -f /workspace/pom.xml -pl discovery-server -am package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=build /workspace/discovery-server/target/*.jar app.jar
RUN chown spring:spring app.jar
USER spring
EXPOSE 8761
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
