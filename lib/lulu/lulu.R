## lulu R script

args <- commandArgs(TRUE)
print(args)
otu_table <- args[1]
match <- args[2]
filename <- args[3]
token <- args[4]

setwd(paste("/app/data/", token, "/", sep=""))

# import the data
otu_table <- read.table(otu_table, header=TRUE, sep="\t")
match <- read.table(match, sep="\t")

dim(otu_table)
dim(match)
print(filename)

require(lulu)
# split the otu table as outputed by slim
taxo <- otu_table[,c((ncol(otu_table)-2):ncol(otu_table))]
otu_id <-  otu_table[,1]
otu <- otu_table[,c(2:(ncol(otu_table)-3))]
rownames(otu) <- rownames(taxo) <- otu_id
# launch the post-clustering
tmp <- lulu(otu, match)	
# remap the taxonomy and OTU id
otu_lulu <- cbind(OTU = rownames(tmp$curated_table), tmp$curated_table, taxo[rownames(tmp$curated_table),])
# resort by OTU id
otu_lulu <- otu_lulu[as.character(sort(as.numeric(rownames(tmp$curated_table)))),]

write.table(otu_lulu, file = filename, quote = F, sep="\t", row.names = F)



