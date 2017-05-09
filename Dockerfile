# Use an official Python runtime as a base image
FROM node:latest

# Set the working directory to /app
RUN mkdir /app
WORKDIR /app

# install app dependencies
COPY package.json /app
RUN npm install

# prepare the web server
COPY server.js /app
COPY www/ /app/www/
EXPOSE 8080

# commamd executed to run the server
CMD ["npm", "start"]
