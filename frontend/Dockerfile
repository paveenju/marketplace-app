# ---- Build stage --------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration production

# ---- Runtime stage: serve the static build with nginx --------------------
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/marketplace-web/browser /usr/share/nginx/html

EXPOSE 80
