# Use official lightweight Node.js 22 LTS image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Set Cloud Run port environment variable (default 8080)
ENV PORT=8080
ENV NODE_ENV=production

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Start the web server
CMD ["node", "server.js"]
