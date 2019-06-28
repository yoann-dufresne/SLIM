## IDTAXA for OTU table

args <- commandArgs(TRUE)

fasta <- args[1]
classifier <- args[2]
filename <- args[3]
threshold <- strtoi(args[4])
proc <- strtoi(args[5])
otu <- args[6]

require('DECIPHER')

## to rename the object as "trainingSet"
trainedClassif <- load(classifier)
trainingSet <- get(trainedClassif)

fastaString <- readDNAStringSet(fasta)
fastaString <- RemoveGaps(fastaString)

ids <- IdTaxa(fastaString,
              trainingSet,
              type="extended",
              strand="top",
              threshold=threshold,
              processors=proc,
              verbose = F)

# import the otu table
otu_data_frame <- read.table(otu, header = T)

# extract assignments and confidence
assign <- array(NA, c(length(ids), 2))
colnames(assign) <- c("taxon", "idtaxa_confidence")
for (i in 1:length(ids))
{
  assign[i,"taxon"] <- paste0(ids[[i]]$taxon, collapse = ';')
  assign[i,"idtaxa_confidence"] <- ids[[i]]$confidence[length(ids[[i]]$confidence)]
}
# adding the seq ref and cleaning up
tmp <- sub(".*cluster=","",names(ids))
rownames(assign) <- sub(";","",tmp)
assign[,"taxon"] <- sub("Root;","",assign[,"taxon"])
assign[,"taxon"] <- sub("unclassified_Root","unassigned",assign[,"taxon"])
assign <- as.data.frame(assign)

output <- cbind(otu_data_frame,assign[as.character(otu_data_frame[,"OTU_ID"]),])

write.table(output, file = filename, quote = F, sep="\t", row.names = F)
