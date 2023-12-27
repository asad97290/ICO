# Use an official Node runtime as a base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY . .

# Install dependencies
RUN yarn



# Command to run the application
CMD ["npm", "run", "dev"]



EXPOSE 5173





