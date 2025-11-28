FROM node:20
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY . .
EXPOSE 3001
VOLUME ["/app/data"]
CMD ["bash", "-lc", "(npm ci || npm install --no-audit --no-fund --no-optional) && npm run build && node server.js"]
