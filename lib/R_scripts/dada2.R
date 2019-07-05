
args <- commandArgs(TRUE)

by_lib <- args[1]
t2s_file <- args[2]
repseq_file <- args[3]
asv_table <- args[4]
token <- args[5]
cpus <- as.numeric(args[6])
fwd <- args[7]
rev <- args[8]

require(dada2)
require(seqinr)

## general path
setwd(paste("/app/data/", token, "/", sep=""))
path <- paste("/app/data/", token, sep="")

# import the t2s
t2s <- read.table(t2s_file, header=TRUE, sep=",")
t2s_name <- sub(".csv", "", tail(strsplit(t2s_file, "/")[[1]], 1))

# if dada by lib
if (by_lib == "true") lib_list <- unique(t2s$run)
if (by_lib != "true") lib_list <- t2s$sample

message("dada2: filterAndTrim")
message("###")

# parse the list of fastq given by SLIM, sample separated by ";"
tmp_fwd <- strsplit(fwd, "£", fixed = T)[[1]]
tmp_rev <- strsplit(rev, "£", fixed = T)[[1]]

# get the path to the fastq
fnFs <- paste0(path, "/", tmp_fwd)
fnRs <- paste0(path, "/", tmp_rev)

# filter and trim (to be adjusted if raw input data, with primers...)
path.filt <- file.path(path, "filterAndTrimed")
filtFs <- file.path(path.filt, basename(fnFs))
filtRs <- file.path(path.filt, basename(fnRs))
filtering <- filterAndTrim(fwd=fnFs, rev=fnRs, filt=filtFs, filt.rev=filtRs, multithread=cpus, verbose=TRUE)
filtering <- cbind(sample_ID = rownames(filtering), filtering)
write.table(filtering, file = paste0(t2s_name, "_filtering.tsv"), quote = F, sep="\t", row.names = F, fileEncoding = "UTF-8")

# extract samples with no reads if any
noReads <- rownames(filtering[filtering[,"reads.out"]==0,])
noReads <- sub("_fwd.fastq", "", noReads)

##keep only samples with reads
keep <- filtering[,"reads.out"] > 0
### file path
filtFs_kept <- filtFs[keep]
filtRs_kept <- filtRs[keep]

# DADA2 workflow
message("Learning error model be passed to DADA2")
message(paste("###", length(lib_list)), " models to learn")
# to collect processed samples
#names_list <- c()

for (i in lib_list)
{
  # fetch here either the list of sample to be processed, or the unique sample from the list
  assign(paste("filtFs_",i, sep=""), filtFs_kept[grep(paste(i, "_", sep=""), filtFs_kept)])
  assign(paste("filtRs_",i, sep=""), filtRs_kept[grep(paste(i, "_", sep=""), filtRs_kept)])
  # to ensure reproducibility
  set.seed(100)
  assign(paste("errFWD_",i, sep=""), learnErrors(get(paste("filtFs_",i, sep="")), nbases = 1e8, multithread=cpus, randomize=TRUE))
  set.seed(100)
  assign(paste("errREV_",i, sep=""), learnErrors(get(paste("filtRs_",i, sep="")), nbases = 1e8, multithread=cpus, randomize=TRUE))
  message("Done... ")
  message("Now denoising.")
  # get the samples
  filtFs_n <- get(paste("filtFs_",i, sep=""))
  filtRs_n <- get(paste("filtRs_",i, sep=""))
  # and the errors profiles
  errF <- get(paste("errFWD_",i, sep=""))
  errR <- get(paste("errREV_",i, sep=""))
  for(j in seq_along(filtFs_n)) {
    drpF <- derepFastq(filtFs_n[[j]])
    ddF <- dada(drpF, err=errF, selfConsist=F, multithread=cpus)
    drpR <- derepFastq(filtRs_n[[j]])
    ddR <- dada(drpR, err=errR, selfConsist=F, multithread=cpus)
    merger <- mergePairs(ddF, drpF, ddR, drpR)
    ## fetch the name of the sample
    name <- tail(strsplit(filtFs_n[[j]], "/")[[1]],1)
    # then remove the prefix from t2s
    prefix <- paste(sub(".csv", "", tail(strsplit(t2s_file, "/")[[1]],1)), "_", as.character(t2s[j,1]), "_", sep="")
    suffix <- "_fwd.fastq"
    name <- sub(prefix, "", name)
    name <- sub(suffix, "", name)
    #names_list <- c(names_list, name)
    saveRDS(merger, file.path(path, paste0(name, "_merger.rds")))
    message(paste(j, "/", length(filtFs_n), " sample ", name, " is done for library: ", i, sep=""))
  }
}

### Create sequence table, and remove chimeras
all_samples <- sort(list.files(path, pattern="_merger.rds", full.names = TRUE))
all_samples_file <- all_samples_names <- all_samples
for(i in 1:length(all_samples_names))
{
  all_samples_file[i] <- gsub(paste(path, "/", sep=""), "", all_samples_names[i])
  all_samples_names[i] <- gsub("_merger.rds", "", all_samples_file[i])
}
# Read the merged data back in
mergers <- vector("list", length(all_samples_file))
names(mergers) <- all_samples_file
for(sample in all_samples_file) {
  mergers[[sample]] <- readRDS(file.path(path, paste0(sample)))
}

# Make table, chimeras not yet removed
ASV_table <- makeSequenceTable(mergers)
rownames(ASV_table) <- all_samples_names

# Consensus chimera removal, recommended
ASV_table_consensus <- removeBimeraDenovo(ASV_table, method = "consensus", multithread=cpus)

# Now extract the ASV sequences and paste them to make a fasta
ASV_headers <- paste0("ASV", c(1:ncol(ASV_table_consensus)))
seqs <- getSequences(ASV_table_consensus)
write.fasta(as.list(seqs), ASV_headers, repseq_file)

# now paste the ASV instead of sequences in the matrix before writing it, sort it to match the t2s and transpose
colnames(ASV_table_consensus) <- ASV_headers

# collect the processed sample in the order as in the t2s_file
#samples_order <- subset(as.character(t2s$sample), t2s$sample %in% names_list)

# create empty vector for samples with no reads
if (length(noReads) > 0)
{
  tmp <- c()
  for (i in 1:length(noReads))
  {
    noReads[i] <- sub(paste0(t2s_name, "_"), "", noReads[i])
    noReads[i] <- sub("_fwd.fastq", "", noReads[i])
    # remove the lib ID from noReads
    for (j in unique(t2s$run)) noReads[i] <- sub(paste0(j, "_"), "", noReads[i])
    tmp <- rbind(tmp, rep(0, length(ASV_headers)))
  }
  rownames(tmp) <- noReads
}

# add the samples with no reads in the ASV table
ASV_table_consensus <- rbind(ASV_table_consensus, tmp)

# transpose and sort as in the t2s
ASV_table_consensus <- t(ASV_table_consensus[as.character(t2s$sample),])
ASV_table_consensus <- data.frame(cbind(ASV_ID = ASV_headers, ASV_table_consensus))
# finally
write.table(ASV_table_consensus, file = asv_table, quote = F, sep="\t", row.names = F, fileEncoding = "UTF-8")
