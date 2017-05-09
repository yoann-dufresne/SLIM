#!/bin/sh

isRunning=$(docker ps | grep amplicon | wc -l)
if [ "$isRunning" -eq "1" ]; then
	echo "amplicon pipeline is running"
	echo "Do you want to kill it ? [y/N]"
	read answer

	if [ "$answer" != "y" ]; then
		exit 0
	fi

	dockerId=$(docker ps | grep amplicon | cut -c1-12)
	echo "Killing the current docker"
	docker stop $dockerId
else
	echo "amplicon pipeline is not running"
fi

echo "Rebuild the docker imqge"
docker build --rm -t amplicon .

echo "Restart the docker"
docker run -p 8080:8080 -d amplicon
