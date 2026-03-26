# Use Node.js 18 LTS
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Install serve for production
RUN npm install -g serve

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
