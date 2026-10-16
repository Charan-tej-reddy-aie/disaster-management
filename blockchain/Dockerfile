# Production Dockerfile for Blockchain EVM node
FROM node:20-alpine

WORKDIR /app

# Install netcat for port polling
RUN apk add --no-cache netcat-openbsd

COPY package*.json ./
RUN npm ci

COPY . .

# Compile contracts
RUN npx hardhat compile

RUN chmod +x start.sh

EXPOSE 8545

CMD ["./start.sh"]
