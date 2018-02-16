![SLIM logo](https://github.com/yoann-dufresne/SLIM/blob/master/www/imgs/slim_logo.svg)

SLIM is a node.js web app providing an easy GUI which wrap bioinformatics tools for amplicon sequencing analysis (from illumina FASTQ to annotated OTU matrix).
All the pipeline is wrapped in a docker to easaly run it.

# Install and run the pipeline

The software can be setup by using the two scripts "update_dependencies.sh" and "update_webserver.sh".
* update_dependencies.sh get all the bioinformatics tools needed from their respective repositories.
* update_webserver.sh destroy the current running webserver to replace it with a new one updated.
**/!\\** All the files previously uploaded on the webserver will be detroyed during the process.  
  
So, you can setup the pipeline using the following 3 command lines:
```bash
sudo apt-get install docker-ce
bash update_dependencies.sh
bash update_webserver.sh
```

If the apt command doesn't work or you want to install the webserver on mac OS, please refer to the docker manual on [https://docs.docker.com](https://docs.docker.com)

# Create a module for the pipeline

To contribute by adding new softwares, you will have to know a little bit of HTML and javascript.
Please refer to the wiki pages to learn [how to create a module](https://github.com/yoann-dufresne/amplicon_pipeline/wiki/How-to-write-a-new-module).

# Current modules by category

## Demultiplexing
* [Double Tag Demultiplexer (DTD)](https://github.com/yoann-dufresne/DoubleTagDemultiplexer): Demultiplex experiments from illumina output files when that data has been generated from double tagged reads with only one PCR.

## Paired-end read joiner
* [Pandaseq](https://github.com/neufeld/pandaseq)
* [vsearch](https://github.com/torognes/vsearch) mergepair
* [CASPER](http://best.snu.ac.kr/casper/)

## Chimera detection
* [vsearch](https://github.com/torognes/vsearch) uchime

## Sequence clustering
* [vsearch](https://github.com/torognes/vsearch) uclust
* [swarm](https://github.com/torognes/swarm)

## Sequence assignment
* [vsearch](https://github.com/torognes/vsearch) usearch

