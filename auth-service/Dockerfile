# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Build TypeScript
RUN npm run build

# Expose the port your app runs on
EXPOSE 3001  

# Start the app
CMD ["npm", "run", "start"]
