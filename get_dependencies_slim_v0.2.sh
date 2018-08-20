#!/bin/sh


if [ ! -d "lib" ]; then
	mkdir lib
fi
cd lib/


# jquery autocomplete
if [ ! -d "jquery-autocomplete" ]; then
	mkdir jquery-autocomplete
	# git clone https://github.com/devbridge/jQuery-Autocomplete.git jquery-autocomplete
	cd jquery-autocomplete
	# git pull
	curl -OL https://github.com/devbridge/jQuery-Autocomplete/archive/v1.4.7.tar.gz
	tar -xzvf v1.4.7.tar.gz
	mv jQuery-Autocomplete-1.4.7/* .
	cd ..
else
	echo "jQuery already there..."
fi

# Papaparser
if [ ! -d "papa" ]; then
	mkdir papa
	#git clone https://github.com/mholt/PapaParse.git papa
	cd papa
	#git pull
	curl -OL https://github.com/mholt/PapaParse/archive/4.4.0.tar.gz
	tar -xzvf 4.4.0.tar.gz
	mv PapaParse-4.4.0/* .
	cd ..
else
	echo "PAPAparser already there..."
fi


# Demultiplexing tool # no stable release yet... oops
if [ ! -d "DTD" ]; then
	git clone https://github.com/yoann-dufresne/DoubleTagDemultiplexer.git DTD/
	cd DTD
	git pull
	cd ..
else
	echo "DTD is already there..."
fi


# Pandaseq
if [ ! -d "pandaseq" ]; then
	mkdir pandaseq
	#git clone https://github.com/neufeld/pandaseq.git pandaseq/
	cd pandaseq
	#git pull
	curl -OL https://github.com/neufeld/pandaseq/archive/v2.11.tar.gz
	tar -xzvf v2.11.tar.gz
	mv pandaseq-2.11/* .
	cd ..
else
	echo "PANDAseq is already there..."
fi


# Vsearch
if [ ! -d "vsearch" ]; then
	mkdir vsearch
	# git clone https://github.com/torognes/vsearch.git vsearch/
	cd vsearch
	curl -OL https://github.com/torognes/vsearch/archive/v2.8.0.tar.gz
	tar -xzvf v2.8.0.tar.gz
	mv vsearch-2.8.0/* .
	# git pull
	cd ..
else
	echo "VSEARCH is already there..."
fi


# QIIME 2
# docker pull qiime2/core:201

# Casper # no repos... oops
cd casper
if [ ! -d "casper_v0.8.2" ]; then
	tar -xzvf casper_v0.8.2.tar.gz
fi
cd ..


# Swarm
if [ ! -d "swarm" ]; then
	mkdir swarm
	# git clone https://github.com/torognes/swarm.git swarm/
	cd swarm
	#git pull
	curl -OL https://github.com/torognes/swarm/archive/v2.2.2.tar.gz
	tar -xzvf v2.2.2.tar.gz
	mv swarm-2.2.2/* .
	cd ..
else
	echo "SWARM is already there..."
fi
