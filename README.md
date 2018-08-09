
<p align="center">
  <img src="https://github.com/yoann-dufresne/SLIM/blob/master/www/imgs/slim_logo.svg" alt="SLIM logo" width="250px"/>
</p>

SLIM is a node.js web app providing an easy Graphical User Interface (GUI) to wrap bioinformatics tools for amplicon sequencing analysis (from illumina paired-end FASTQ to annotated OTU matrix).
All the pipeline is embedded in a [docker](https://www.docker.com/).

# Install and deploy the web app

See below for full instructions

# Accessing the webserver

The execution of the `start_slim_v1.1.sh` script deploys and start the webserver.
By default, the webserver is accessible on the 8080 port.

To access it on a remote server from your machine, type the server IP address followed by ":8080" (for example `156.241.0.12:8080`) from an internet browser (prefer Firefox and Google Chrome)
If SLIM is deployed on your own machine, type `localhost:8080/`

If the server is correctly set, you should see this:

<p align="left">
  <img src="https://github.com/trtcrd/SLIM/blob/fluent_install/tutos/slim_webpage.png" alt="SLIM homepage" width="800px"/>
</p>

# Prepare and upload your data

The "file uploader" section allows you to upload all the required files. Usually it consists of:
- one (or multiple) pair(s) of FASTQ files corresponding to the library(ies) (can be zipped)
- a CSV (Comma-separated values) file containing the correspondance between library, tagged-primers pairs and samples (the so-called tag-to-sample file, see below for an example)
- a FASTA file containing the tagged primers sequences and name (see below for an example)
- a FASTA file containing sequence reference database (see below for an example)

**Example of tag-to-sample file:**
This file must contain at least the four four fields: run, sample, forward and reverse. "Run" corresponds to your illumina library identification; "sample" corresponds to the names of your samples in the library; "forward" and "reverse" corresponds to the names of your tagged primers.

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
Such database can be downloaded for instance from [SILVA](https://www.arb-silva.de/) for both prokaryotes and eukaryotes (16S and 18S), [EUKREF](https://eukref.org/) for eularyotes (18S), [UNITE](https://unite.ut.ee/repository.php) for fungi (ITS), [MIDORI](http://www.reference-midori.info/download.php#) for metazoan (COI).
Each header include a unique identifier (usually the accession), a space ' ', and the taxonomic path separated by a semi-colon (without any space, please use "_" underscore).

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
4. OTU clustering
5. Taxonomic assignement

The "Add a new module" section has a drop-down list containing various modules to pick, set and chain.
Pick one and hit the "+" button. This will add the module at the bottom of the first section, and prompting you to fill the required fields. For more informations on the modules, you can refer to their manuals on the wiki or by clicking the (i) button on the module interface.

The chaining between module is made through the files names used as input / output. To point to a set of samples (all samples from the tag-to-sample, or all the samples from the library_1 for instance), we use a '*' to mean 'all', and we add the processing step as a suffix :
- all samples from the tag-to-sample file that have been demultiplexed: 'tag_to_sample*_fwd.fastq' and 'tag_to_sample*_rev.fastq'
- all samples from the library_1 that have been demultiplexed: 'tag_to_sample_Library_1*_fwd.fastq' and 'tag_to_sample_Library_1*_rev.fastq'
- all samples from the tag-to-sample file that have been joined: 'tag_to_sample*_merge-vsearch.fasta'
- all samples from the tag-to-sample file that have been joined and chimera filtered: 'tag_to_sample*_merge-vsearch_uchime.fasta'

The same principle applies for OTU matrices, we add the previous processing step as a suffix in the file name.

see below for the demultiplexing

<p align="left">
  <img src="https://github.com/trtcrd/SLIM/blob/fluent_install/tutos/slim_demultiplexer.png" alt="SLIM example" width="800px"/>
</p>


and below for the OTU clustering and taxonomic assignement

<p align="left">
  <img src="https://github.com/trtcrd/SLIM/blob/fluent_install/tutos/slim_otu.png" alt="SLIM example" width="800px"/>
</p>


Once your workflow is set, please fill the email field and click on the start button.
Your job will automatically be scheduled on the server.
You will receive an email when your job starts and when your job is over.
This email contains a direct link to your job, so you can close the internet browser tab once you started the execution.

When your job is over, you will have small icons of download on the right of each output field.
All the uploaded, intermediate and results files are available to download.
Your files will remain available on the server during 24h, after what they will be removed for disk usage optimisation

For more details on the app, you can refer to the [wiki pages](https://github.com/yoann-dufresne/SLIM/wiki)

# Install and deploy the web app

First of all, docker needs to be installed on the machine. You can find instructions here :
* [docker for Debian](https://docs.docker.com/install/linux/docker-ce/debian/)
* [docker for Ubuntu](https://docs.docker.com/install/linux/docker-ce/ubuntu/)
* [docker for macOS](https://docs.docker.com/docker-for-mac/install/)

To install SLIM, get the last stable release [here](https://github.com/trtcrd/SLIM/archive/v1.1.tar.gz) or, using terminal :
```bash
sudo apt-get update && apt-get install git curl
curl -OL https://github.com/trtcrd/SLIM/archive/v1.1.tar.gz
tar -xzvf v1.1.tar.gz
cd SLIM-1.1
```

Before deploying SLIM, you need to configure the mailing account that will be used for mailing service.
We advise to use gmail, as it is already set in the 'server/config.js' file.
This file need to be updated with your 'user' and 'pass' fields on the server, as below:

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


As soon as docker is installed and running, the SLIM archive downloaded and the mailing account set, it can be deployed by using the two scripts `get_dependencies_slim_v1.1.sh` and `start_slim_v1.1.sh` as **super user**.
* `get_dependencies_slim_v1.1.sh` fetches all the bioinformatics tools needed from their respective repositories.
* `start_slim_v1.1.sh` destroys the current running webserver to replace it with a new one.
**/!\\** All the files previously uploaded and the results of analysis will be detroyed during the process.

```bash
sudo bash get_dependencies_slim_v1.1.sh
sudo bash start_slim_v1.1.sh
```



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

## Sequence clustering
* [vsearch](https://github.com/torognes/vsearch) uclust
* [swarm](https://github.com/torognes/swarm)

## Sequence assignment
* [vsearch](https://github.com/torognes/vsearch) usearch

## Post-clustering
* [LULU](https://github.com/tobiasgf/lulu)


# Version history

v1.1

Updated the `get_dependencies` script.

v1.0

First stable release, with third-parties versions handled within the `get_dependencies_slim.sh` script.
