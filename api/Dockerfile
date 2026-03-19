FROM node:20-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all API files (excluding test thanks to .dockerignore)
COPY . .

# Expose API port
EXPOSE 4000

# Start with nodemon but ignore test directory
CMD ["npx", "nodemon", "--ignore", "test/", "api.js"]