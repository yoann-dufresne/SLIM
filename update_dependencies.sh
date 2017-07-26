#!/bin/sh

if [ ! -d "lib" ]; then
	mkdir lib
fi
cd lib/



# jquery autocomplete
if [ ! -d "jquery-autocomplete" ]; then
	git clone https://github.com/devbridge/jQuery-Autocomplete.git jquery-autocomplete
else
	cd jquery-autocomplete
	git pull
	cd ..
fi


# Papaparser
if [ ! -d "papa" ]; then
	git clone https://github.com/mholt/PapaParse.git papa
else
	cd papa
	git pull
	cd ..
fi


# Demultiplexing tool
if [ ! -d "DTD" ]; then
	git clone https://github.com/yoann-dufresne/DoubleTagDemultiplexer.git DTD/
else
	cd DTD
	git pull
	cd ..
fi


# Pandaseq
if [ ! -d "pandaseq" ]; then
	git clone https://github.com/neufeld/pandaseq.git pandaseq/
else
	cd pandaseq
	git pull
	cd ..
fi


# Vsearch
if [ ! -d "vsearch" ]; then
	git clone https://github.com/torognes/vsearch.git vsearch/
else
	cd vsearch
	git pull
	cd ..
fi


# QIIME 2
docker pull qiime2/core:2017.6


# Casper
cd casper
if [ ! -d "casper_v0.8.2" ]; then
	tar -xzvf casper_v0.8.2.tar.gz
fi
cd ..



