# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_KAKAO_JAVASCRIPT_KEY

# Set them as ENV so Vite can use them during the build process
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KAKAO_JAVASCRIPT_KEY=$VITE_KAKAO_JAVASCRIPT_KEY

# Build the frontend bundle
RUN npm run build

# Runtime stage
FROM nginx:alpine

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
