# ----- Basic docker constructions -----

# Use an official node runtime as a base image
FROM node:latest

# Set the working directory to /app
RUN mkdir /app
WORKDIR /app

# Add the CRAN repos sources for install latest version of R
RUN sh -c 'echo "deb http://cran.rstudio.com/bin/linux/debian jessie-cran3/" >> /etc/apt/sources.list'
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 06F90DE5381BA480

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
	dos2unix \
	python3-pip python3-dev python3-numpy python3-biopython \ 
	r-base


## solving locales issue for biopython
RUN apt-get install -y locales locales-all
ENV LC_ALL=en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US.UTF-8
RUN dpkg -l locales


#RUN export LANGUAGE=en_US.UTF-8
# RUN dpkg -l locales
RUN python3 -m pip install biopython --upgrade

RUN mkdir /app/lib


# ----- Very long updates -----

COPY lib/miniconda /app/lib/miniconda
# Install miniconda
# RUN bash /app/lib/miniconda/Miniconda3-latest-Linux-x86_64.sh -b -p /app/lib/miniconda/install \
#	&& /app/lib/miniconda/install/bin/conda update conda -y
# Install QIIME 2
# RUN /app/lib/miniconda/install/bin/conda create -n qiime2-2017.6 --file https://data.qiime2.org/distro/core/qiime2-2017.6-conda-linux-64.txt


# ----- R dependancies -----

###RUN apt-get -y build-dep libcurl4-gnutls-dev
###RUN apt-get -y install libcurl4-gnutls-dev
RUN R -e 'install.packages("devtools", repos="http://cran.mirrors.hoobly.com/")'
RUN R -e 'install.packages("dplyr", repos="http://cran.mirrors.hoobly.com/")'
RUN R -e 'library(devtools);install_github("tobiasgf/lulu")'


# ----- Libraries deployments -----

# install app dependencies
COPY package.json /app
RUN npm install

# Copy libraries
COPY lib/DTD /app/lib/DTD
COPY lib/pandaseq /app/lib/pandaseq
COPY lib/vsearch /app/lib/vsearch
COPY lib/casper /app/lib/casper
COPY lib/swarm /app/lib/swarm
COPY lib/python_scripts /app/lib/python_scripts
COPY lib/R_scripts /app/lib/R_scripts

# Compile DTD
RUN cd /app/lib/DTD && make && cd /app
# Compile pandaseq
RUN cd /app/lib/pandaseq && ./autogen.sh && ./configure && make && cd /app
# Compile vsearch
RUN cd /app/lib/vsearch && ./autogen.sh && ./configure && make && cd /app
# Compile casper
RUN cd /app/lib/casper/casper_v0.8.2 && make && cd /app
# Compile swarm
RUN cd /app/lib/swarm/src && make && cd /app


# ----- Webserver -----

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
