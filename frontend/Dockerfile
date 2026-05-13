FROM node:22-alpine AS build
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/dist/frontend/browser/ .
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
