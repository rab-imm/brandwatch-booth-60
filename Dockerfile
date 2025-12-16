# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to handle conflicts
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - use Node.js with serve
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Railway injects PORT env var
ENV PORT=8080

EXPOSE 8080

# Serve the static files - serve reads PORT env var automatically
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:$PORT"]
