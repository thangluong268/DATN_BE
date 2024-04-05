# Stage 1: Build the application
FROM node:16 AS build

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json to the container
COPY package*.json ./

# Install production dependencies
RUN npm install

# Copy the source code into the container
COPY . .

# Build your NestJS application
RUN npm run build

# Stage 2: Create a production-ready image
FROM node:16

# Set the working directory in the container
WORKDIR /app

# Copy the production dependencies from the build stage
COPY --from=build /app/.env ./
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Expose the port used by your NestJS application
EXPOSE 9200

# Start your NestJS application in production mode
CMD ["npm", "run", "start:prod"]
