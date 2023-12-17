# Use an official Node runtime as a base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /ICO-frontend

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN yarn

# Copy the public and src directories to the container
COPY public/ /ICO-frontend/public
COPY src/ /ICO-frontend/src


# Command to run the application
CMD ["npm", "run", "dev"]
