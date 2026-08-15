# Node.js 20 Alpine Builder Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools for native packages
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

# Copy dependency files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema and generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY . .

# Runtime Stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for OCR / Image processing
RUN apk add --no-cache cairo pango jpeg giflib librsvg tesseract-ocr tesseract-ocr-data-eng

# Copy application artifacts from builder
COPY --from=builder /app /app

# Ensure uploads and logs directories exist
RUN mkdir -p /app/uploads /app/logs

EXPOSE 8082

ENV NODE_ENV=production

# Health check probing health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8082/api/health || exit 1

CMD ["sh", "-c", "npx prisma db push && npm start"]
