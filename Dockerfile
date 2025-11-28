FROM node:20
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY . .
EXPOSE 3001
VOLUME ["/app/data"]
CMD ["bash", "-lc", "npm install --no-audit --no-fund && npm run build && node server.js"]
