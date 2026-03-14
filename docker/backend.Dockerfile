# Build stage
FROM node:25-alpine AS build

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/src ./src

# Production stage
FROM node:25-alpine

WORKDIR /app

COPY --from=build /app/package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/src ./src

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "src/index.js"]
