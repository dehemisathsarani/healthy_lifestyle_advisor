FROM node:18-alpine

WORKDIR /app

# Copy package.json for potential future use
COPY package*.json ./

# Copy our static files and server script
COPY public/ ./public/
COPY server.js .

# Expose the port the app runs on
EXPOSE 5175

# Command to run the app
CMD ["node", "server.js"]
