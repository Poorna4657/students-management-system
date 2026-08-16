# Backend Dockerfile (server folder) — multi-stage build

# 1) Builder: install dev deps and build TypeScript
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# 2) Runner: smaller runtime image with only production deps + built artifacts
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy built files
COPY --from=builder /app/dist ./dist
# Copy package.json and install only production dependencies
COPY --from=builder /app/package.json ./package.json
RUN npm ci --production --silent
EXPOSE 5000
CMD ["node", "dist/server.js"]
