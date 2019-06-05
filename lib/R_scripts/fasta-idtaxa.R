library(DECIPHER)

args <- commandArgs(TRUE)

fasta <- args[1]
classifier <- args[2]
filename <- args[3]
threshold <- strtoi(args[4])
proc <- strtoi(args[5])

load(classifier)

fastaString <- readDNAStringSet(fasta)
fastaString <- RemoveGaps(fastaString)

ids <- IdTaxa(fastaString,
              trainingSet,
              type="extended",
              strand="top",
              threshold=threshold,
              processors=proc,
              verbose = F)

output <- sapply(ids,function(x)paste(taxon$taxon,collapse=";"))
output <- sub("Root;","",output)
write.table(output, file = filename, quote = F, sep="\t", row.names = T)
