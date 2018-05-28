## lulu R script

args <- commandArgs(TRUE)
print(args)
otu_table <- args[1]
match <- args[2]
filename <- args[3]
token <- args[4]
coocur <- args[5]

setwd(paste("/app/data/", token, "/", sep=""))

# import the data
otu_table <- read.table(otu_table, header=TRUE, sep="\t", row.names=1)
match <- read.table(match, sep="\t")

require(lulu)
# split the otu table as outputed by slim
taxo <- otu_table[,c((ncol(otu_table)-2):ncol(otu_table))]
otu_id <-  rownames(otu_table)

## Is there taxonomic assignments in taxo?
ifelse (is.numeric(taxo[,1]), otu <- otu_table[,c(1:(ncol(otu_table)))], otu <- otu_table[,c(1:(ncol(otu_table)-3))])

rownames(otu) <- rownames(taxo) <- otu_id

# need to do that otherwise it is taken as factors
match[,1] <- as.character(match[,1])
match[,2] <- as.character(match[,2])

# launch the post-clustering
tmp <- lulu(otu, match, coocur)
# remap the taxonomy and OTU id
ifelse (is.numeric(taxo[,1]), otu_lulu <- cbind(OTU_ID = rownames(tmp$curated_table), tmp$curated_table), otu_lulu <- cbind(OTU = rownames(tmp$curated_table), tmp$curated_table, taxo[rownames(tmp$curated_table),]))
# resort by OTU id
otu_lulu <- otu_lulu[paste0("OTU", as.character(sort(as.numeric(gsub("OTU", "", rownames(tmp$curated_table)))))),]


write.table(otu_lulu, file = filename, quote = F, sep="\t", row.names = F)
