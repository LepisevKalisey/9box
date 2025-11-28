FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
RUN npm install --no-audit --no-fund --legacy-peer-deps
COPY . .
RUN npm run build
# Prepare production node_modules without dev dependencies
RUN npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY server.js ./server.js
EXPOSE 3001
VOLUME ["/app/data"]
CMD ["node", "server.js"]
