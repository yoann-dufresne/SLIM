
Amplicon pipeline is a node.js web app providing an easy GUI which wrap bioinformatics tools for amplicon sequencing analysis.

# Install and run the pipeline

# Create a module

## Web interface, create a module

To create a GUI for your module, you need to create 2 files in www/modules/.
If your module is named "mymodule", the two files must be named "mymodule.html" and "mymodule.js".

## Parameters format, send the request

To trigger the software on the server, you have to send the parameters in json format.
When the user push the button start analysis, the client side application ask to each module their configurations. Each module will correspond to a json object in the json request. This json object must be created and returned by the function `getConfiguration` of the module class.  
  
The parameters are always divided in three set: The inputs, the outputs and the software settings.
All the three categories must be formatted as an object with a list of attribute.
The inputs and outputs formats are very constrained because of the program scheduler.
The scheduler will defined software priorities depending of the inputs/outputs dependencies.
```json
{
	"inputs": {"name1": "value1", "name2": "value2", ...},
	"outputs": {"name1": "value1", "name2": "value2", ...},
	"params": {"name1": "value1", "name2": "value2", ...}
}
```

Using the getConfiguration method from the super class, you will get an object correctly formatted without any entry in the inputs/outputs/params sub-objects.  

## Server software, trigger the good software with good parameters

The server must contain a module "mymodule.js" in the directory server/modules/.
This file must contains at least 2 things: A module name and a function run.

the module name must be set using this line:

```javascript
exports.name = 'mymodule';
```
The name will be used by the server and the client to automatically transmit the html and js client files.
If the name is not set, the module will not appear in the usable software on the client side.

The run function must transform the json input to a Linux command line using the software.
During this process you have to be careful for the server security.
Never execute programs without analysis information from the client!

```javascript
exports.run = function (token, config, callback) { ... };
```
The token argument correspond to the current directory for the process execution.
All the input/output file will be present in the directory /data/'token'  
The config object will contain all the information from client formatted as the json presented in the previous part.  
The callback function is the function that you must call when the execution is over.
This callback take two arguments.
The first one must be the token and the second one a message if the execution went wrong.

You can use the [pandaseq module](https://github.com/yoann-dufresne/amplicon_pipeline/blob/master/server/modules/pandaseq.js) as example.

# Dependencies

## Bioinformatics tools

* Double Tag Demultiplexer (DTD): Demultiplex experiments from illumina output files when that data has been generated from double tagged reads with only one PCR.
* Pandaseq: Join the forward and reverse reads. [link](https://github.com/neufeld/pandaseq)
* vsearch: Used to remove chimeras, cluster reads in OTUs and assign taxon to OTUs. [link](https://github.com/torognes/vsearch)
* QIIME2: Interface multiple bioinformatics tools. [link](https://qiime2.org/)

## node.js libraries

* Express: web framework
* Pug: templates engine
* Formidable: Parse multi-part post requests (File uploads)
* body-parser: Parse json post requests (Commands)

## client js libraries

* JQuery: asynch requests
