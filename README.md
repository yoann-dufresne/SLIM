
<p align="center">
  <img src="https://github.com/yoann-dufresne/SLIM/blob/master/www/imgs/slim_logo.svg" alt="SLIM logo" width="250px"/>
</p>

SLIM is a node.js web app providing an easy Graphical User Interface (GUI) to wrap bioinformatics tools for amplicon sequencing analysis (from illumina paired-end FASTQ to annotated ASV/OTU matrix).
All the pipeline is embedded in a [docker](https://www.docker.com/).

# Install and deploy the web app

See below for full instructions

# Accessing the webserver

The execution of the `start_slim_v0.6.2.sh` script deploys and start the webserver.
By default, the webserver is accessible on the 8080 port.

* To access it on a remote server from your machine, type the server IP address followed by ":8080" (for example `156.241.0.12:8080`) from an internet browser (prefer Firefox and Google Chrome).
* If SLIM is deployed on your own machine, type `localhost:8080/`

If the server is correctly set, you should see this:

<p align="left">
  <img src="https://github.com/trtcrd/SLIM/blob/master/tutos/slim_webpage.png" alt="SLIM homepage" width="800px"/>
</p>

# Prepare and upload your data

The "file uploader" section allows you to upload all the required files. Usually it consists of:
- one (or multiple) pair(s) of FASTQ files corresponding to the library(ies) (can be zipped)
- a CSV (Comma-separated values) file containing the correspondance between library, tagged-primers pairs and samples (the so-called tag-to-sample file, see below for an example)
- a FASTA file containing the tagged primers sequences and name (see below for an example)
- a FASTA file containing sequence reference database (see below for an example)

**Example of tag-to-sample file:**
This file must contain at least the four four fields: run, sample, forward and reverse. "Run" corresponds to your illumina library identification; "sample" corresponds to the names of your samples in the library; "forward" and "reverse" corresponds to the names of your tagged primers.
**Samples names MUST be unique, even for replicates sequenced in multiples libraries**

```
run,sample,forward,reverse
library_1,sample_1,forwardPrimer-A,reversePrimer-B
library_1,sample_2,forwardPrimer-B,reversePrimer-C
library_2,sample_3,forwardPrimer-A,reversePrimer-B
library_2,sample_4,forwardPrimer-B,reversePrimer-C
```

**Example of primers FASTA file:**
It contains the names of your tagged primers and their sequences, in a conventional FASTA format. Each primer tag consists of 4 variables nucleotides at the 5' side, prior the template specific part.
Each primer must contains a specific identifier (by letters in this example). The primers sequences can include IUPAC nucleotide codes, they are taken into account.

```
>forwardPrimer-A
ACCTGCCTAGCGTYG
>forwardPrimer-B
GAATGCCTAGCGTYG
>reversePrimer-B
GAATCTYCAAATCGG
>reversePrimer-C
ACTACTYCAAATCGG
```

**Example of sequences reference database file**

This FASTA file contains reference sequences with unique identifier and taxonomic path in the header.
Such database can be downloaded for instance from [SILVA](https://www.arb-silva.de/) for both prokaryotes and eukaryotes (16S and 18S), [EUKREF](https://eukref.org/) or [PR2](https://github.com/pr2database/pr2database) for eukaryotes (18S), [UNITE](https://unite.ut.ee/repository.php) for fungi (ITS), [MIDORI](http://www.reference-midori.info/download.php#) for metazoan (COI).
Each header include a unique identifier (usually the accession),
a space ' ', and the taxonomic path separated by a semi-colon (without any space, please use "_" underscore).
**You should have the same amount of taxonomic rank for each reference sequences**

```
>AB353770 Eukaryota;Alveolata;Dinophyta;Dinophyceae;Dinophyceae_X;Dinophyceae_XX;Peridiniopsis;Peridiniopsis_kevei
ATGCTTGTCTCAAAGATTAAGCCATGCATGTCTCAGTATAAGCTTTTACATGGCGAAACTGCGAATGGCTCATTAAAACAGTTACAGTTTATTTGAA
GGTCATTTTCTACATGGATAACTGTGGTAATTCTAGAGCTAATACATGCGCCCAAACCCGACTCCGTGGAAGGGTTGTATTTATTAGTTACAGAACC
AACCCAGGTTCGCCTGGCCATTTGGTGATTCATAATAAACGAGCGAATTGCACAGCCTCAGCTGGCGATGTATCATTCAAGTTTCTGACCTATCAGC
TTCCGACGGTAGGGTATTGGCCTACCGTGGCAATGACGGGTAACGGAGAATTAGGGTTCGATTCCGGAGAGGGAGCCTGA
>KC672520 Eukaryota;Opisthokonta;Fungi;Ascomycota;Pezizomycotina;Leotiomycetes;Leotiomycetes_X;Leotiomycetes_X_sp.
TACCTGGTTGATTCTGCCCCTATTCATATGCTTGTCTCAAAGATTAAGCCATGCATGTCTAAGTATAAGCAATATATACCGTGAAACTGCGAATGGC
TCATTATATCAGTTATAGTTTATTTGATAGTACCTTACTACT
>AB284159 Eukaryota;Alveolata;Dinophyta;Dinophyceae;Dinophyceae_X;Dinophyceae_XX;Protoperidinium;Protoperidinium_bipes
TGATCCTGCCAGTAGTCATATGCTTGTCTCAAAGATTAAGCCATGCATGTCTCAGTATAAGCTTCAACATGGCAAGACTGTGAATGGCTCATTAAAA
CAGTTGTAGTTTATTTGGTGGCCTCTTTACATGGATAGCCGTGGTAATTCTAGAACTAATACATGCGCTCAAGCCCGACTTCGCAGAAGGGCTGTGT
TTATTTGTTACAGAACCATTTCAGGCTCTGCCTGGTTTTTGGTGAATCAAAATACCTTATGGATTGTGTGGCATCAGCTGGTGATGACTCATTCAAG
CTT
```


# Analyse your data

Usually, a typical workflow would include:
1. Demultiplexing the libraries (if each library corresponds to a single sample, adapt your tag-to-sample file accordingly, and proceed to the joining step)
2. Joining the paired-end reads
3. Chimera removal
4. ASVs inference / OTUs clustering
5. Taxonomic assignement

The "Add a new module" section has a drop-down list containing various modules to pick, set and chain.
Pick one and hit the "+" button. This will add the module at the bottom of the first section, and prompting you to fill the required fields. For more informations on the modules, you can refer to their manuals on the wiki or by clicking the (i) button on the module interface.

**The use of wildcard '*' for file pointing**

The chaining between module is made through the files names used as input / output. To avoid having to select mannually all the samples to be included in an analysis, wildcards '*' (meaning 'all') are generated and used by the application.
Such wildcards are generated from the compressed libraries fastq files (tar.gz) and by the tag-to-sample file.
**Users cannot type on their own wildcards in the file names**. Instead, the application has an autocompletion feature and will make wildcards suggestions for the user to select within the GUI.

To point to a set of samples (all samples from the tag-to-sample, or all the samples from the library_1 for instance), there will be a '*', and the application adds the processing step as a suffix incrementaly:
- all samples from the tag-to-sample file that have been demultiplexed: 'tag_to_sample*_fwd.fastq' and 'tag_to_sample*_rev.fastq'
- all samples from the library_1 that have been demultiplexed: 'tag_to_sample_Library_1*_fwd.fastq' and 'tag_to_sample_Library_1*_rev.fastq'
- all samples from the tag-to-sample file that have been joined: 'tag_to_sample*_merge-vsearch.fasta'
- all samples from the tag-to-sample file that have been joined and chimera filtered: 'tag_to_sample*_merge-vsearch_uchime.fasta'

The same principle applies for ASV/OTU matrices, we add the previous processing step as a suffix in the file name.

see below for the demultiplexing

<p align="left">
  <img src="https://github.com/trtcrd/SLIM/blob/master/tutos/slim_demultiplexer.png" alt="SLIM example" width="800px"/>
</p>


and below for an OTU clustering using vsearch and taxonomic assignement

<p align="left">
  <img src="https://github.com/trtcrd/SLIM/blob/master/tutos/slim_otu.png" alt="SLIM example" width="800px"/>
</p>


Once your workflow is set, please fill the email field and click on the start button.
Your job will automatically be scheduled on the server.
You will receive an email when your job starts, if you job aborted and when your job is over.
This email contains a direct link to your job so that the internet browser tab can be closed once the execution started.

When the job is over, you will have small icons of download on the right of each output field.
All the uploaded, intermediate and results files are available to download.
Your files will remain available on the server during 24h, after what they will be removed for disk usage optimisation

Each module status is displayed besides its names:
- waiting: the execution started, the module is waiting for files input.
- running: the module is busy.
- warnings: there was some warnings during the execution, but the module is still running.
- aborted: the module aborted and the pipeline has stopped its execution.
- ended: the module has finnished its task.

For more details on the app, you can refer to the [wiki pages](https://github.com/yoann-dufresne/SLIM/wiki)

# Install, deploy and manage the web app

First of all, docker needs to be installed on the machine. You can find instructions here :
* [docker for Debian](https://docs.docker.com/install/linux/docker-ce/debian/)
* [docker for Ubuntu](https://docs.docker.com/install/linux/docker-ce/ubuntu/)
* [docker for macOS](https://docs.docker.com/docker-for-mac/install/)

To install SLIM, get the last stable release [here](https://github.com/trtcrd/SLIM/archive/v0.6.2.tar.gz) or, using terminal :
```bash
sudo apt-get update && apt-get install git curl
curl -OL https://github.com/trtcrd/SLIM/archive/v0.6.2.tar.gz
tar -xzvf v0.6.2.tar.gz
cd SLIM-0.6.2
```

Before deploying SLIM, you need to configure the mailing account that will be used for mailing service.
We advise to use gmail, as it is already set in the 'server/config.js' file.
This file need to be updated with your 'user' and 'pass' credentials on the server:

```
exports.mailer = {
	host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'username',
        pass: 'password'
    }
}
```


As soon as docker is installed and running, the SLIM archive downloaded and the mailing account set, it can be deployed by using the two scripts `get_dependencies_slim_v0.6.2.sh` and `start_slim_v0.6.2.sh` as **super user**.
* `get_dependencies_slim_v0.6.2.sh` fetches all the bioinformatics tools needed from their respective repositories.
* `start_slim_v0.6.2.sh` destroys the current running webserver to replace it with a new one. **/!\\** All the files previously uploaded and the results of analysis will be detroyed during the process.

```bash
sudo bash get_dependencies_slim_v0.6.2.sh
sudo bash start_slim_v0.6.2.sh
```

The server is configured to use up to 8 CPU cores per job. The amount of available cores will determine the amount of job that can be executed in parallel (1-8 -> 1 job, 16 -> 2 jobs, etc.). To admin and access SLIM logs, please refer to the docker command line [documentation](https://docs.docker.com/engine/reference/commandline/docker/).


# Creating your own module

To contribute by adding new softwares, you will have to know a little bit of HTML and javascript.
Please refer to the wiki pages to learn [how to create a module](https://github.com/yoann-dufresne/SLIM/wiki/How-to-write-a-new-module).

# Current modules by category

## Demultiplexing
* [DTD](https://github.com/yoann-dufresne/DoubleTagDemultiplexer): Demultiplex libraries from illumina outputs

## Paired-end read joiner
* [Pandaseq](https://github.com/neufeld/pandaseq)
* [vsearch](https://github.com/torognes/vsearch) mergepair
* [CASPER](http://best.snu.ac.kr/casper/)

## Chimera detection
* [vsearch](https://github.com/torognes/vsearch) uchime

## ASVs inference / OTUs clustering
* [DADA2](https://github.com/benjjneb/dada2)
* [vsearch](https://github.com/torognes/vsearch) uclust
* [swarm](https://github.com/torognes/swarm)

## Sequence assignment
* [vsearch](https://github.com/torognes/vsearch) usearch
* [IDTAXA](http://www2.decipher.codes/Documentation/Documentation-ClassifySequences.html)

## Post-clustering
* [LULU](https://github.com/tobiasgf/lulu)


# Version history

### v0.6.2

Dockerfile: updated systeminformation and docker recipe

### v0.6.1

Dockerfile: updated to DADA2 v1.16 and DECIPHER v2.16.0, cleaned the docker recipe

### v0.6

BUGFIX: resolved issues with the order of module execution when DADA2 is used.
BUGFIX: resolved issues with the pipeline.conf file that did not included the checkbox and radio buttons.

### v0.5.3

DTD: added an option for trimming the primers at the end of the reads in (for fully overlapping pair-end reads) and a contig length filtering

### v0.5.2

DADA2 beta integration, small fix on IDATAXA

### v0.5.1

BUGFIX of the IDTAXA module, added wiki for the module

### v0.5

Integration of the IDTAXA module

### v0.4.1

Fixed the Dockerfile to fetch the latest R version and CASPER util.c file

### v0.4

Added timing checkpoints in the logs of the scheduler; Added the third-party software version infos in the email

### v0.3

Fixed LULU module and the otu table writing is now done by a python script

### v0.2

Updated the `get_dependencies` script.

### v0.1

First release, with third-parties versions handled within the `get_dependencies_slim.sh` script.
