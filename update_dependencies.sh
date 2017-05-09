#!/bin/sh

cd lib/js

# Resumable update
if [ -d "resumable" ]; then
	cd resumable
	git pull origin master
	cd ..
else
	git clone https://github.com/23/resumable.js.git resumable
fi
