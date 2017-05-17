
Amplicon pipeline is a node.js web app providing an easy GUI which wrap bioinformatics tools for amplicon sequencing analysis.

# Tools basicaly included

# Install and run the pipeline

# Create a module

## Web interface, create a module

## Parameters format, send the request

To trigger the software on the server, you have to send the parameters in json format.
When the user push the button start analysis, the client side application ask to each module their configurations. Each module will correspond to a json object in the json request. This json object must be created and returned by the function `getConfiguration` of the module class.  
  
The parameters are always divided in three set: The inputs, the outputs and the software settings.
All the three categories must be formatted as an object with a list of attribute.
The inputs and outputs formats are very constrained because of the program scheduler.
The scheduler will defined softwares priorities depending of the inputs/outputs dependencies.
```json
{
	"inputs": {"name1": "value1", "name2": "value2", ...},
	"outputs": {"name1": "value1", "name2": "value2", ...},
	"params": {"name1": "value1", "name2": "value2", ...}
}
```

Using the getConfiguration method from the super class, you will get an object correctly formated without any entry in the inputs/outputs/params sub-objects.  

## Server software, trigger the good software with good parameters

# Dependencies

## Bioinformatics tools

## node.js libraries

* Express: web framework
* Pug: templates engine
* Formidable: Parse multi-part post requests (File uploads)
* body-parser: Parse json post requests (Commands)

## client js libraries

* JQuery: asynch requests
