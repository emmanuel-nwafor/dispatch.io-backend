# Use official Node.js image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build the TypeScript project
RUN npm run build

# Expose the port (Render handles this, but good practice)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
