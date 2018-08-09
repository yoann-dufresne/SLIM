#!/bin/sh

isRunning=$(docker ps | grep slim | wc -l)
if [ "$isRunning" -eq "1" ]; then
	echo "slim is running"
	echo "Do you want to kill it ? [y/N]"
	read answer

	if [ "$answer" != "y" ]; then
		exit 0
	fi

	dockerId=$(docker ps | grep slim | cut -c1-12)
	echo "Killing the current docker"
	docker stop $dockerId
else
	echo "slim is not running"
fi

echo "Rebuild the docker image"
docker ps --filter status=dead --filter status=exited --filter status=created -aq | xargs docker rm -v
docker images  -f "dangling=true" -q | xargs docker rmi -f
docker build -t slim .
#docker rmi -f $(docker images -f "dangling=true" -q)

echo "Restart the docker"
docker run -p 8080:80 -d slim
