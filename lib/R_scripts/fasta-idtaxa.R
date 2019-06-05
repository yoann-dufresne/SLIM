## IDTAXA for a fasta file

args <- commandArgs(TRUE)

fasta <- args[1]
classifier <- args[2]
filename <- args[3]
threshold <- strtoi(args[4])
proc <- strtoi(args[5])

require('DECIPHER')

## to rename the Taxa object as "trainingSet"
trainingSet <- load(classifier)
trainingSet <- get(trainingSet)

fastaString <- readDNAStringSet(fasta)
fastaString <- RemoveGaps(fastaString)

ids <- IdTaxa(fastaString,
              trainingSet,
              type="extended",
              strand="top",
              threshold=threshold,
              processors=proc,
              verbose = F)

# extract assignments and confidence
assign <- array(NA, c(length(ids), 3))
colnames(assign) <- c("seq_header", "taxon", "idtaxa_confidence")
for (i in 1:length(ids))
{
  assign[i,"taxon"] <- paste0(ids[[i]]$taxon, collapse = ';')
  assign[i,"idtaxa_confidence"] <- ids[[i]]$confidence[length(ids[[i]]$confidence)]
}
# adding the seq ref and cleaning up
assign[,"seq_header"] <- names(ids)
assign[,"taxon"] <- sub("Root;","",assign[,"taxon"])
assign[,"taxon"] <- sub("unclassified_Root","unassigned",assign[,"taxon"])
assign <- as.data.frame(assign)


write.table(assign, file = filename, quote = F, sep="\t", row.names = F)
