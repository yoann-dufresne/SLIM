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


# Swarm
if [ ! -d "swarm" ]; then
	git clone https://github.com/torognes/swarm.git swarm/
else
	cd swarm
	git pull
	cd ..
fi


# mistag_filter
if [ ! -d "mistag_filter" ]; then
	git clone https://github.com/FranckLejzerowicz/mistag_filter.git mistag_filter/
else
	cd mistag_filter
	git pull
	cd ..
fi

# abundance_filters
if [ ! -d "abundance_filters" ]; then
	git clone https://github.com/FranckLejzerowicz/abundance_filters.git abundance_filters/
else
	cd abundance_filters
	git pull
	cd ..
fi


# Blast+
if [ ! -d "blast" ]; then
	mkdir blast
	wget -qO- ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/LATEST/ncbi-blast-2.6.0+-x64-linux.tar.gz | tar xvz -C blast/
fi


# pad_with_gaps
if [ ! -d "scripts" ]; then
	mkdir scripts
	if [ ! -d "scripts/pad_with_gaps" ]; then
		git clone https://github.com/FranckLejzerowicz/pad_with_gaps.git scripts/pad_with_gaps/
	else
		cd scripts/pad_with_gaps
		git pull
		cd ../..
	fi
else
	cd scripts
	if [ ! -d "pad_with_gaps" ]; then
		git clone https://github.com/FranckLejzerowicz/pad_with_gaps.git pad_with_gaps/
	else
		cd pad_with_gaps
		git pull
		cd ..
	cd ..
	fi
fi
