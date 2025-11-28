FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
# If you have a lock file, uncomment the next line and use npm ci
# COPY package-lock.json .
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY package.json .
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY server.js ./server.js
EXPOSE 3001
VOLUME ["/app/data"]
CMD ["node", "server.js"]