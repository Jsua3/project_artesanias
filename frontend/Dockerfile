# Usa los archivos ya compilados localmente (dist/frontend/browser/)
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

# Copiar archivos pre-compilados de Angular
COPY frontend/dist/frontend/browser/ .

# Copiar configuración de nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
