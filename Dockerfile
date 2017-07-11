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
	pkg-config \
	libboost-all-dev \
	pigz \
	dos2unix

# install app dependencies
COPY package.json /app
RUN npm install

# Copy libraries
RUN mkdir /app/lib
COPY lib/DTD /app/lib/DTD
COPY lib/pandaseq /app/lib/pandaseq
COPY lib/vsearch /app/lib/vsearch
COPY lib/miniconda /app/lib/miniconda

# Install miniconda
RUN bash /app/lib/miniconda/Miniconda3-latest-Linux-x86_64.sh -b -p /app/lib/miniconda/install \
	&& /app/lib/miniconda/install/bin/conda update conda -y
# Install QIIME 2
RUN /app/lib/miniconda/install/bin/conda create -n qiime2-2017.6 --file https://data.qiime2.org/distro/core/qiime2-2017.6-conda-linux-64.txt
# Compile DTD
RUN cd /app/lib/DTD && make && cd /app
# Compile pandaseq
RUN cd /app/lib/pandaseq && ./autogen.sh && ./configure && make && cd /app
# Compile vsearch
RUN cd /app/lib/vsearch && ./autogen.sh && ./configure && make && cd /app


# prepare the web server
COPY server /app
COPY www/ /app/www/
EXPOSE 80

# copy npm libraries
# jquery
RUN cp node_modules/jquery/dist/jquery.js /app/www/js/jquery.js
COPY lib/jquery-autocomplete/dist/jquery.autocomplete.js /app/www/js/jquery.autocomplete.js
COPY lib/papa/papaparse.js /app/www/js/papaparse.js

# prepare data folder
RUN mkdir /app/data


# commamd executed to run the server
CMD ["npm", "start"]
