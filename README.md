
<p align="center">
  <img src="https://github.com/yoann-dufresne/SLIM/blob/master/www/imgs/slim_logo.svg" alt="SLIM logo" width="250px"/>
</p>

SLIM is a node.js web app providing an easy GUI which wrap bioinformatics tools for amplicon sequencing analysis (from illumina FASTQ to annotated OTU matrix).
All the pipeline is wrapped in a docker to easily run it.

# Install and run the pipeline

The software can be setup by using the two scripts "get_dependencies_slim_v1.0.sh" and "start_slim_v1.0.sh".
* get_dependencies_slim_v1.0.sh get all the bioinformatics tools needed from their respective repositories.
* start_slim_v1.0.sh destroy the current running webserver to replace it with a new one updated.
**/!\\** All the files previously uploaded on the webserver will be detroyed during the process.

To install SLIM, you can either get the last stable release (strongly advised):
```bash
curl -OL https://github.com/trtcrd/SLIM/archive/v1.0.tar.gz
tar -xzvf v1.0.tar.gz
cd SLIM-1.0
```

Alternatively, you can download the current development version :
```bash
git clone https://github.com/trtcrd/SLIM.git
```

And then deploy SLIM :
```bash
sudo apt-get install docker-ce
bash get_dependencies_slim_v1.0.sh
bash start_slim_v1.0.sh
```


If the apt command doesn't work or you want to install SLIM on macOS, please refer to the docker manual on [https://docs.docker.com](https://docs.docker.com)

# Analyse data

Before any analysis, you need to know the server IP address where SLIM is installed.

In your web browser address bar (avoid safari, prefer chrome or firefox), type the server IP address followed by ":8080" (for example 156.241.0.12:8080).
If the server is correctly setup, you should be on this web page:

<p align="center">
  <img src="https://github.com/yoann-dufresne/SLIM/blob/master/tutos/slim_webpage.png" alt="SLIM homepage" width="600px"/>
</p>

The first part of the web page is the upload section.
This is where you will upload all your files to be processed.

The second part of the web page allows you to setup your workflow.
All the modules will be added to the workflow using the drop down list.
For more informations on the modules, please refer to their manuals on the wiki or by clicking the (i) button on the module interface.

Once your workflow is set, please fill the email field and click on the start button.
Your job will automatically be scheduled on the server.
You will receive an email when your job is over.
This email will contain a link to your job, so, you can close the app tab once you started the execution.

When your job is over, you will have small icons of download on the right of each output field.
All the uploaded, intermediate and results files are available to download.
Your files will remain available on the server during 24h, after what they will be removed for disk usage optimisation

For more details on the app, please read the [wiki pages](https://github.com/yoann-dufresne/SLIM/wiki)

# Create a module for the pipeline

To contribute by adding new softwares, you will have to know a little bit of HTML and javascript.
Please refer to the wiki pages to learn [how to create a module](https://github.com/yoann-dufresne/SLIM/wiki/How-to-write-a-new-module).

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

## Post-clustering
* [LULU](https://github.com/tobiasgf/lulu)

## Sequence assignment
* [vsearch](https://github.com/torognes/vsearch) usearch


# Version history

Current 1.0

[![DOI](https://zenodo.org/badge/121395325.svg)](https://zenodo.org/badge/latestdoi/121395325)

First stable release, with third-parties versions handled within the get_dependencies_slim script.
