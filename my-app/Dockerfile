FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all app files
COPY . .

# Expose Next.js port
EXPOSE 3000

# Start Next.js in dev mode
CMD ["npm", "run", "dev"]