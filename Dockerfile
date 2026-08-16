# Frontend Dockerfile — build with Node and serve with nginx

# 1) Build stage
FROM node:18-alpine AS builder
WORKDIR /app
# Install dependencies (uses package-lock.json for reproducible installs)
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy source files and build the Vite app
COPY . .
RUN npm run build

# 2) Production stage — nginx
FROM nginx:stable-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
# Custom nginx config for SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
