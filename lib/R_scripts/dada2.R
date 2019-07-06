
args <- commandArgs(TRUE)

by_lib <- args[1]
t2s_file <- args[2]
repseq_file <- args[3]
asv_table <- args[4]
token <- args[5]
cpus <- as.numeric(args[6])
stats <- args[7]
pool <- args[8]
fwd <- args[9]
rev <- args[10]


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

# pool option
if (pool == "false") pool <- FALSE
if (pool == "pseudo") pool <- "pseudo"
if (pool == "true") pool <- TRUE

message("DADA2: filterAndTrim step")

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

# copying it to do the stats later and keep match between filtering and filtFs
filter_stats <- filtering

# extract samples with no reads if any
noReads <- rownames(filtering[filtering[,"reads.out"]==0,])
noReads <- sub("_fwd.fastq", "", noReads)

##keep only samples with reads
parsfiltFs <- sub(paste0(path, "/filterAndTrimed/"), "", filtFs)
parsfiltFs <- sub("_fwd.fastq", "", parsfiltFs)
filtFs_kept <- filtFs[!parsfiltFs %in% noReads]
filtRs_kept <- filtRs[!parsfiltFs %in% noReads]
# for the t2s
t2s_keep <- t2s[!paste0(t2s_name, "_", t2s$run, "_", t2s$sample) %in% noReads,]
# and for lib_list (if by denoising by sample)
if (by_lib != "true") lib_list <- t2s_keep$sample

message("DADA2: filterAndTrim done...")

# DADA2 workflow
message("DADA2: Learning error model(s) step")
cpt <- 1

for (i in lib_list)
{
  message(paste("DADA2: learning ", paste(cpt, "/", length(lib_list))))
  # fetch here either the list of sample to be processed, or the unique sample from the list
  assign(paste("filtFs_",i, sep=""), filtFs_kept[grep(paste0(i, "_"), filtFs_kept)])
  assign(paste("filtRs_",i, sep=""), filtRs_kept[grep(paste0(i, "_"), filtRs_kept)])
  # get the same rows from t2s
  if (by_lib == "true") assign(paste("t2s_keep_",i, sep=""), t2s_keep[grep(paste0("^", i, "$"), t2s_keep$run),])
  if (by_lib != "true") assign(paste("t2s_keep_",i, sep=""), t2s_keep[grep(paste0("^", i, "$"), t2s_keep$sample),])
  # to ensure reproducibility
  set.seed(100)
  assign(paste("errFWD_",i, sep=""), learnErrors(get(paste0("filtFs_",i)), nbases = 1e8, multithread=cpus, randomize=TRUE))
  set.seed(100)
  assign(paste("errREV_",i, sep=""), learnErrors(get(paste0("filtRs_",i)), nbases = 1e8, multithread=cpus, randomize=TRUE))
  message("DADA2: model ready...")
  message("DADA2: denoising step")
  # get the samples
  filtFs_n <- get(paste("filtFs_",i, sep=""))
  filtRs_n <- get(paste("filtRs_",i, sep=""))
  # and the errors profiles
  errF <- get(paste("errFWD_",i, sep=""))
  errR <- get(paste("errREV_",i, sep=""))
  for(j in seq_along(filtFs_n)) {
    drpF <- derepFastq(filtFs_n[[j]])
    ddF <- dada(drpF, err=errF, selfConsist=F, multithread=cpus, pool = pool)
    drpR <- derepFastq(filtRs_n[[j]])
    ddR <- dada(drpR, err=errR, selfConsist=F, multithread=cpus, pool = pool)
    merger <- mergePairs(ddF, drpF, ddR, drpR)
    ## fetch the name of the sample
    name <- tail(strsplit(filtFs_n[[j]], "/")[[1]],1)
    # then remove the prefix from t2s
    prefix <- paste(sub(".csv", "", tail(strsplit(t2s_file, "/")[[1]],1)), "_", as.character(get(paste("t2s_keep_",i, sep=""))[j,1]), "_", sep="")
    suffix <- "_fwd.fastq"
    name <- sub(prefix, "", name)
    name <- sub(suffix, "", name)
    saveRDS(merger, file.path(path, paste0(name, "_merger.rds")))
    message(paste(j, "/", length(filtFs_n), " sample ", name, " is done for : ", i, sep=""))
  }
  cpt <- cpt + 1
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

# count total reads per sample (with chimeras)
withChim <- rowSums(ASV_table)

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
    for (j in unique(t2s_keep$run)) noReads[i] <- sub(paste0(j, "_"), "", noReads[i])
    tmp <- rbind(tmp, rep(0, length(ASV_headers)))
  }
  rownames(tmp) <- noReads
  # and for the filtering stats
  emptySamples <- c(rep(0,length(noReads)))
  names(emptySamples) <- noReads
  withChim <- c(withChim, emptySamples)
}

# add the samples with no reads in the ASV table
if (length(noReads) > 0) ASV_table_consensus <- rbind(ASV_table_consensus, tmp)

# transpose table and sort table and noChimera count as in the t2s
ASV_table_consensus <- t(ASV_table_consensus[as.character(t2s$sample),])
withChim <- withChim[as.character(t2s$sample)]
ASV_table_consensus <- data.frame(cbind(ASV_ID = ASV_headers, ASV_table_consensus))
# finally write the ASV sorted table
write.table(ASV_table_consensus, file = asv_table, quote = F, sep="\t", row.names = F, fileEncoding = "UTF-8")

# adding the statistics on dada2 discarding reads

# cleaning the rownames of filter_stat
for (i in 1:length(rownames(filter_stats))) rownames(filter_stats)[i] <- sub(paste0(t2s_name, "_"), "", rownames(filter_stats)[i])
for (i in 1:length(rownames(filter_stats))) rownames(filter_stats)[i] <- sub("_fwd.fastq", "", rownames(filter_stats)[i])
for (i in unique(t2s$run)) rownames(filter_stats) <- sub(paste0(i,"_"), "", rownames(filter_stats))
# sorting as in the t2s
filter_stats <- filter_stats[as.character(t2s$sample),]
filter_stats <- cbind(sample_ID = rownames(filter_stats), filter_stats, reads.dada2 = withChim)

tmp <- data.frame(ASV_table_consensus[,c(2:ncol(ASV_table_consensus))])
# annoying no numeric
for (i in 1:ncol(tmp)) tmp[,i] <- as.numeric(as.character(tmp[,i]))
filter_stats <- cbind(filter_stats, reads.dada2.noChimera = colSums(tmp))

write.table(filter_stats, file = stats, quote = F, sep="\t", row.names = F, fileEncoding = "UTF-8")
