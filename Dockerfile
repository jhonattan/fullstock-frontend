FROM node:lts-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:lts-alpine AS production
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Set ownership before installing
RUN chown -R node:node /app

# Switch to node user BEFORE installing dependencies
USER node

COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/generated ./generated
COPY --from=builder --chown=node:node /app/prisma ./prisma

EXPOSE 3000

CMD [ "sh", "-c", "npm run prisma:migrate:deploy && npm run start" ]