# Stage 1: Build the application
FROM node:18 AS build

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json to the container
COPY package*.json ./

# Install production dependencies
RUN yarn install

# Copy the source code into the container
COPY src ./src
COPY .env.prod ./
COPY nest-cli.json ./
COPY tsconfig*.json ./


# Build your NestJS application
RUN yarn build

# Stage 2: Create a production-ready image
FROM node:lts-bookworm-slim

# Set the working directory in the container
WORKDIR /app
RUN apt-get update

# Copy the production dependencies from the build stage
COPY --from=build /app/.env.prod ./
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Expose the port used by your NestJS application
EXPOSE 5000

# Start your NestJS application in production mode
CMD ["yarn", "start:prod"]
