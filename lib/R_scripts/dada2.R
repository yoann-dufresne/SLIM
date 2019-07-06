
args <- commandArgs(TRUE)

dada_lib <- args[1]
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
if (dada_lib == "true") by_lib <- TRUE
if (dada_lib != "true") by_lib <- FALSE
if (by_lib)  lib_list <- unique(t2s$run)
if (!by_lib) lib_list <- t2s$sample

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
if (!by_lib) lib_list <- t2s_keep$sample

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
  if (by_lib)  assign(paste("t2s_keep_",i, sep=""), t2s_keep[grep(paste0("^", i, "$"), t2s_keep$run),])
  if (!by_lib) assign(paste("t2s_keep_",i, sep=""), t2s_keep[grep(paste0("^", i, "$"), t2s_keep$sample),])
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
  ## derep and dada
  drpF <- derepFastq(filtFs_n)
  drpR <- derepFastq(filtRs_n)
  # rename with sample names

  for (j in 1:length(filtFs_n))
  {
    name_full <- filtFs_n[j]
    prefix <- paste(path, "/filterAndTrimed/", sub(".csv", "", tail(strsplit(t2s_file, "/")[[1]],1)), "_",
      as.character(get(paste0("t2s_keep_",i))[j,1]), "_", sep="")
    suffix <- "_fwd.fastq"
    name <- sub(prefix, "", name_full)
    name <- sub(suffix, "", name)
    if (by_lib) names(drpF)[j] <- name
    if (by_lib) names(drpR)[j] <- name
  }

  ddF <- dada(drpF, err=errF, selfConsist=F, multithread=cpus, pool = pool)
  ddR <- dada(drpR, err=errR, selfConsist=F, multithread=cpus, pool = pool)
  merger <- mergePairs(ddF, drpF, ddR, drpR)
  # export merger file
  if (by_lib)
  {
    saveRDS(merger, file.path(path, paste0(i, "_merger.rds")))
    for (k in 1:length(merger)) saveRDS(merger[k], file.path(path, paste0(names(merger)[k], "_merger.rds")))
  }
  if (!by_lib) saveRDS(merger, file.path(path, paste0(name, "_merger.rds")))
  message(paste(j, "/", length(filtFs_n), " sample ", name, " is done for : ", i, sep=""))
  cpt <- cpt + 1
}

### Create sequence table, and remove chimeras
all_rds <- sort(list.files(path, pattern="_merger.rds", full.names = TRUE))
all_rds_file <- all_rds_names <- all_rds

for(i in 1:length(all_rds))
{
  all_rds_file[i] <- gsub(paste(path, "/", sep=""), "", all_rds_names[i])
  all_rds_names[i] <- gsub("_merger.rds", "", all_rds_file[i])
}

# if by lib, we need to reconstruct the merger
if (by_lib)
{
  all_merger <- c()
  for(i in 1:length(all_rds))
  {
    assign(paste0("merger_",all_rds_names[i]), readRDS(file.path(path, paste0(all_rds_file[i]))))
    all_merger <- c(all_merger, get(paste0("merger_",all_rds_names[i])))
  }
} else {
  all_merger <- vector("list", length(all_rds_file))
  names(all_merger) <- all_rds_names
  for(i in all_rds_names)
  {
    all_merger[[i]] <- readRDS(file.path(path, "/", paste0(i,"_merger.rds")))
  }
}

# Make table, chimeras not yet removed
ASV_table <- makeSequenceTable(all_merger)
#rownames(ASV_table) <- all_rds_names

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
