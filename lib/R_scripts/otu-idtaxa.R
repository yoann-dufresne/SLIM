library(DECIPHER)

args <- commandArgs(TRUE)

fasta <- args[1]
classifier <- args[2]
filename <- args[3]
threshold <- strtoi(args[4])
proc <- strtoi(args[5])
otu <- args[6]

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

otu_data_frame <- read.table(otu)
taxon <- sapply(ids,function(x)paste(x$taxon,collapse=";"))
taxon <- sub("Root;","",taxon)
taxon <- as.data.frame(taxon)

temp<-sub(".*cluster=","",rownames(taxon))
V1<-sub(";","",temp)
combined<-cbind(V1,taxon)
output <- merge(otu_data_frame,combined,by.y="V1")

write.table(output, file = filename, quote = F, sep="\t", row.names = F)
