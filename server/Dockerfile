# server/Dockerfile
# Builds a minimal production image for the Ludo Royale Socket.IO server.
# Works on any platform that accepts a Dockerfile: Render, Railway, Fly.io,
# Google Cloud Run, AWS ECS/App Runner, etc.

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV PORT=3001
EXPOSE 3001

CMD ["node", "server.js"]
