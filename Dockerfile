FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV AUTH_SECRET=bidledger-change-me-in-production
ENV HOSTNAME=0.0.0.0

RUN npm run build

EXPOSE 3000

CMD ["node", "scripts/boot.mjs"]
