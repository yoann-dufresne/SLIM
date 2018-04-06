
<p align="center">
  <img src="https://github.com/yoann-dufresne/SLIM/blob/master/www/imgs/slim_logo.svg" alt="SLIM logo" width="250px"/>
</p>

SLIM is a node.js web app providing an easy GUI which wrap bioinformatics tools for amplicon sequencing analysis (from illumina FASTQ to annotated OTU matrix).
All the pipeline is wrapped in a docker to easily run it.

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

# Analyse data

Before any analysis, you have to now a server address where SLIM is installed.

Then the usage of SLIM is very simple.
In your web browser address bar, type the server address followed by ":8080" (for example 156.241.0.12:8080).
Now, if the server is correctly setup, you should be on this web page:

<p align="center">
  <img src="https://github.com/yoann-dufresne/SLIM/blob/master/tutos/slim_webpage.png" alt="SLIM homepage" width="600px"/>
</p>

The first part of the web page is the upload section.
This is where you will upload all your file to process.

The second part of the web page is the part where you setup your workflow.
All the modules will be added to the workflow using the drop down list.
For more information on the modules, please refer to their manuals on the wiki or by clicking the (i) button on the module interface.

Once you have set up your software list, please fill the email field and click on the start button.
Your job will automatically be scheduled on the server.
You will receive an email when your job is over.
This email will contain a link to your job, so, you can close the app tab when you started the execution.

When your job is over, you will have small icons of download on the right of each output field.
All the files created from the beginning are available.
So, you can download your final files and also all the intermediate results.
You files will be available on the server during 24h.

For more details on the app, please read the [wiki pages](https://github.com/yoann-dufresne/amplicon_pipeline/wiki/)

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

## Post-clustering
* [LULU](https://github.com/tobiasgf/lulu)

## Sequence assignment
* [vsearch](https://github.com/torognes/vsearch) usearch

