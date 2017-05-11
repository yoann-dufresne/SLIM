# Use an official Python runtime as a base image
FROM node:latest

# Set the working directory to /app
RUN mkdir /app
WORKDIR /app


# Install packages needed for tools
RUN apt-get update && apt-get install -y \
	build-essential \
	libtool \
	automake \
	zlib1g-dev \
	libbz2-dev \
	pkg-config

# Copy libraries
RUN mkdir /app/lib
COPY lib/pandaseq /app/lib/pandaseq

# Compile pandaseq
RUN cd /app/lib/pandaseq && ./autogen.sh && ./configure && make && cd /app

# install app dependencies
COPY package.json /app
RUN npm install

# prepare the web server
COPY server.js /app
COPY files_upload.js /app
COPY sub_process.js /app
COPY accounts.js /app
COPY www/ /app/www/
EXPOSE 80

# copy npm libraries
# jquery
RUN cp node_modules/jquery/dist/jquery.js /app/www/js/jquery.js

# prepare data folder
RUN mkdir /app/data


# commamd executed to run the server
CMD ["npm", "start"]
