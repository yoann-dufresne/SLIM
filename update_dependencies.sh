#!/bin/sh

# For the libraries not present in npm
if [ ! -d "lib" ]; then
	mkdir lib
fi
if [ ! -d "lib/js" ]; then
	mkdir lib/js
fi

cd lib/js

cd ../..



# For the tools to compile
cd lib/

if [ ! -d "lib/pandaseq" ]; then
	git clone https://github.com/neufeld/pandaseq.git pandaseq/
	cd pandaseq
else
	cd pandaseq
	git pull
fi



