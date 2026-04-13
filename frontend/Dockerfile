# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files first for dependency caching
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY frontend/ .

# Build for production
RUN npx ng build --configuration=production

# ---- Runtime stage ----
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf ./*

# Copy built Angular app
COPY --from=build /app/dist/frontend/browser/ .

# Copy custom nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
