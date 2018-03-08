#include <cstdlib>
#include <fstream>
#include <cstring>
#include <sstream>
#include <omp.h>
#include <iostream>
#include <sys/time.h>
#include <boost/unordered_map.hpp>
#include <vector>
#include "merge.h"
#include "util.h"

//#define KMER_WRITE

// Default Paramater Values ---------------------------------------------------
int   MINOVERLAP   = 10;
int   KMERSIZE     = 17;
int   NUM_THREAD   = omp_get_num_procs();
int   THRD_QVLDIFF = 19;      // threshold for difference of quality score
float THRD_GIVEUP  = 0.5;     // threshold for mismatch ratio to gives up 
int   F_DBG        = false;   // flag for Debugging 
int   F_JELLYFISH  = true;   // flag for jellyfish k-mer use
int   F_READSLEFT  = false;   // flag for writing of left reads (unmerged reads)
string PREFIX      = "casper";
string UPR_PREFIX  = "CASPER";
//-----------------------------------------------------------------------------
int   KMER_LOWER_LIMIT = 2;


typedef boost::unordered_map<string, int> unordMap;

unordMap KMER_TBL;
vector<READ> FREAD, RREAD; 
vector<string> seqid;

int  handle_param( int argc, char **argv );
void handle_inputfile( char **argv );
void make_kmerindex();
void use_jellyfish( char **argv );
void do_merging();
void open_outputfile( ofstream &fp, const string & filename );
void write_result( ofstream & fp, const string &seqid, const READ & outREAD );
void do_mergeprocess( const int ovl_loc, READ F_read, READ R_read, READ &MR_read );
static void introduce();
static void long_usage();
static void dis_para_error( const string & message, bool & bErrorFlag );

void dis_inputs_info( char **argv ) {
	cout << "\n  Input Files";
	cout << "\n     -  Forward file     : " << argv[0] 
	     << "\n     -  Reverse file     : " << argv[1] << "\n";
}

void dis_options() {
	cout << "\n  Parameters";
	cout << "\n     -  Number of threads for parallel processing : " << NUM_THREAD 
	     << "\n     -  K-mer size                                : " << KMERSIZE
	     << "\n     -  Threshold for difference of quality score : " << THRD_QVLDIFF
	     << "\n     -  Threshold for mismatching ratio           : " << THRD_GIVEUP 
	     << "\n     -  Minimum length of overlap                 : " << MINOVERLAP 
	     << "\n     -  Using Jellyfish                           : " << ( (F_JELLYFISH) ? "true" : "false");
	if( F_DBG && F_JELLYFISH) (void)system( "jellyfish --version" );
	cout << "\n    ";
}

void dis_outputs_info() {
	cout << "\n  Output Files";
	cout << "\n     -  Merged output file            : " << PREFIX << ".fastq\n";
	if( F_READSLEFT ) {
	cout << "     -  Not merged forward side file  : " << PREFIX << "_for_left.fastq\n";
	cout << "     -  Not merged reverse side file  : " << PREFIX << "_rev_left.fastq\n";
	}
}

/*--------------------------------------------------------------
Merging process needs mainly three steps
	- Handling of input files (forward, reverse reads file)
	- Constructing K-mer frequency table
	- Actual merging
	   . Finding overlap region
		 . Resolving mismatching bases
		 . Write merged reads to output file
---------------------------------------------------------------*/
int main(int argc, char **argv)
{
	timeval  start, finish, elapsed;
	ifstream for_fp, rev_fp;

	gettimeofday(&start, NULL);

	//-- Handling of parameters
	if( handle_param( argc, argv ) ) exit(1);
	argc -= optind;
	argv += optind;

	cout << "=============================================================================\n";
	cout << "[" << UPR_PREFIX << "] Context-Aware Scheme for Paired-End Read\n";

	//-- Step 1 : Handling of input file 
	dis_inputs_info(argv);
	handle_inputfile( argv );
	dis_options();

	//-- Step 2 : Constructing K-mer frequency
	if( F_JELLYFISH == true ) use_jellyfish(argv);
	else make_kmerindex();

	//-- Step 3 : Actual merging
	dis_outputs_info();
	do_merging();

	FREAD.clear(); RREAD.clear();
	seqid.clear();

	gettimeofday(&finish, NULL);
	timersub(&finish, &start, &elapsed);
	printf("     -  TIME for total processing : %6ld.%03ld sec\n", elapsed.tv_sec, elapsed.tv_usec/1000 );
	cout << "=============================================================================\n";
}

static void dis_para_error( const string & message, bool & bErrorFlag ) {
	bErrorFlag=true;
	cout << "[Error] Option is out of range" << endl;
	cout << "   " << message << endl;
}

/*------------------------------------------------------------
	Handling of Parameters & System parameters Initialize
------------------------------------------------------------*/
int handle_param( int argc, char **argv )
{
	int c;
	bool bStopFlag=false, bErrorFlag=false;
	static const char *optlist = "t:k:d:g:w:hvo:Djl";
	int system_num_thread = omp_get_num_procs();
	string sErrMsg="";
	
	while( (c=getopt( argc, argv, optlist)) != -1 ) {
		switch( c ) {
		case 't':		// number of threads
			NUM_THREAD = strtol( optarg, NULL , 10 );
			if( (NUM_THREAD<=0) || (NUM_THREAD>system_num_thread) ) {
				sErrMsg = "Range of OPTION  : 1 <= t <= " + itoa(system_num_thread);
				dis_para_error( sErrMsg, bErrorFlag );
			}
			break;
		case 'k':		// k-mer size
			KMERSIZE = strtol( optarg, NULL , 10 );
			if( (KMERSIZE<2) || (KMERSIZE>31) ) {
				sErrMsg = "Range of OPTION  : 2 <= k <= 31";
				dis_para_error( sErrMsg, bErrorFlag );
			}
			break;
		case 'd':		// Quality Score Difference Threshold Value
			THRD_QVLDIFF = strtol( optarg, NULL , 10 );
			if( (THRD_QVLDIFF<=0) || (THRD_QVLDIFF>=40) ) {
				sErrMsg = "Range of OPTION  : 0 < d < 40";
				dis_para_error( sErrMsg, bErrorFlag );
			}
			break;
		case 'g':
			THRD_GIVEUP = (float) atof( optarg ); 
			if( (THRD_GIVEUP<=0) || (THRD_GIVEUP>=1) ) {
				sErrMsg = "Range of OPTION  : 0 < g < 1";
				dis_para_error( sErrMsg, bErrorFlag );
			}
			break;
		case 'w':
			MINOVERLAP = strtol( optarg, NULL , 10 );
			if( (MINOVERLAP<=2) || (MINOVERLAP>=32) ) {
				sErrMsg = "Range of OPTION  : 2 < w < 32";
				dis_para_error( sErrMsg, bErrorFlag );
			}
			break;
		case 'h':		// Display Help Manual
			bStopFlag=true;
			long_usage();
			break;
		case 'v':		// Display Version Info
			bStopFlag=true;
			introduce();
			break;
		case 'o':		// output prefix default casper
			PREFIX = string( optarg );
			break;
		case 'D':		// for Debugging more detailed execution process
			F_DBG = true;
			break;
		case 'j':		// By default, Jellyfish is used. 
								//Using this option, internal naive k-mer counter is used 
			F_JELLYFISH = false;
			break;
		case 'l':		// for Unmerged Seq to left
			F_READSLEFT = true;
			break;
		}
	}

	if( system_num_thread < NUM_THREAD ) NUM_THREAD = system_num_thread;
	omp_set_num_threads( NUM_THREAD );

	if( bErrorFlag==true ) {
		bStopFlag=true;
		cout << "   '" << PROGNAME << " -h' for detailed help" << endl;
	}
	else {
		if( bStopFlag==false && (argc-optind) < 2 ) {
			bStopFlag=true;
			introduce();
		}
	}

	return bStopFlag;
}


static void introduce() 
{
	cout << "=============================================================================\n";
	cout << "Program : CASPER (Context-Aware Scheme for Paired-End Read)\n";
	cout << "Description : CASPER uses quality score and k-mer frequency for merging.\n";
	cout << "          When the difference between the quality scores of mismathcing base\n";
	cout << "          is significant, CASPER relies on the quality scores for correction.\n";
	cout << "          If not, CASPER instead examines k-mer-based contexts around the mismatch\n";
	cout << "          and makes a statistical decision.\n";
	cout << "Version : " << VERSION << endl;
	cout << "Usage   : " << PROGNAME << " forward.fastq reverse.fastq [OPTIONS]\n";
	cout << "         '" << PROGNAME << " -h' for detailed help\n";
	cout << "=============================================================================\n";
}

static void long_usage() 
{
	cout << "=============================================================================\n";
	cout << "Usage   : " << PROGNAME << " forward.fastq reverse.fastq [OPTIONS]\n";
	cout << "\n    " << BOLD << UNDERLINE << "[MANDATORY]" << RESET;
	cout << "\n     Input forward side FASTQ file first."
		   << "\n     Input reverse side FASTQ file following the forward file.\n";
	cout << "\n    " << BOLD << UNDERLINE << "[OPTIONS]" << RESET; 
	cout << "\n     -t  <int>   The number of threads for parallel proessing"
	     << "\n                 (default=" << NUM_THREAD <<" up to maximum number of system limit)\n"
	     << "\n     -k  <int>   The size of k-mers used to represent contexts around"
			 << "\n                 mismatching bases.                   (default=" << KMERSIZE << ")\n" 
	     << "\n     -d  <int>   Threshold for difference of quality-scores"
	     << "\n                 Context-based mismatch resolution starts if quality scores"
	     << "\n                 differ less than 'd'."
	     << "\n                 Smaller value indicates more trust to quality scores than k-mer context."
	     << "\n                 (default=" << THRD_QVLDIFF << ")\n" 
	     << "\n     -g  <float> Threshold for mismatch ratio of best overlap region"
	     << "\n                 CASPER gives up merging if the mismatch ratio in the overlap"
	     << "\n                 is greater than 'g' and leaves the two reads unmerged."
	     << "\n                 If all the reads have overlap then set 'g' as default or higher."
	     << "\n                 Or if you want sensitive for not merging(TN) then set 'g' as "
	     << "\n                 lower than default. (0.27 or lower is recommended)"
	     << "\n                 (default=" << THRD_GIVEUP << ")\n" 
	     << "\n     -w  <int>   The minimum length (in bp) of the overlap between forward"
	     << "\n                 and reverse reads.               (default=" << MINOVERLAP << "bp)\n" 
	     << "\n     -o  <str>   Prefix of output          (default=" << PREFIX << ")" 
	     << "\n                 By default, '" << PREFIX << ".fastq' <- merged output is generated.\n"
	     << "\n     -j          Internal naive k-mer counting method is used instead of Jellyfish."
			 << "\n                 By default (without this option), Jellyfish (for k-mer counting)"
			 << "\n                 is used to speed up.\n" 
	     << "\n     -l          CASPER can generate the unmerged output file." 
	     << "\n                 prefix_for_left.fastq, prefix_rev_left.fastq for forward, reverse "
			 << "\n                 individually.\n"
	     << "\n     -h          Help for usage information\n" 
	     << "\n     -v          Version information\n" 
	     << "\n      *          CASPER do not need PHRED offset. Either PHRED+64 or PHRED+33 is OK."
	     << "\n                 Only the difference between two quality scores instead of absolute"
	     << "\n                 value is used.\n";
	cout << "\n    " << BOLD << UNDERLINE << "[Examples]" << RESET; 
	cout << "\n      case1: using Jellyfish, output prefix is out, k-mer=19, threads=6,"
	     << "\n      $ casper forward.fastq reverse.fastq -o out -k 19 -t 6"
			 << "\n      case2: without Jellyfish, give up threshold=0.27"
			 << "\n      $ casper forward.fastq reverse.fastq -j -g 0.27";
	cout << "\n=============================================================================\n";
}


int get_kmer_count( const string &seed ) {
	unordMap::iterator itrt;

	itrt = KMER_TBL.find( seed );
	if( itrt != KMER_TBL.end() ) return itrt->second;
	else return 0;
}

int whichside_in_kmer( const string &fseq, const string &rseq ){
	int fcount, rcount;

	fcount = get_kmer_count( fseq );
	rcount = get_kmer_count( rseq );

	if( fcount > rcount ) return FORWARD;
	else if( fcount < rcount ) return REVERSE;
	else if( fcount != 0 ) return REVERSE;
	else return NOTBOTH;
}


int full_kmerscan( int loc, const string &fseq, const string &rseq, int length ) {
	string seed, fseed, rseed;
	int    rslt[3]={0,0,0};
	int    startloop=loc, endloop=length;

	if( loc-KMERSIZE+1 < 0 ) startloop=KMERSIZE-1;
	if( length > loc+KMERSIZE ) endloop=loc+KMERSIZE;

	for( int i=startloop; i<endloop; i++ ) {  // original
		fseed = fseq.substr(i-KMERSIZE+1, KMERSIZE);
		rseed = rseq.substr(i-KMERSIZE+1, KMERSIZE);
		rslt[ whichside_in_kmer( fseed, rseed ) ] += 1;
		if( i+1<endloop )	
			if(fseq[i+1]!=rseq[i+1] ) break;		// very important
	}

	if( rslt[FORWARD] > rslt[REVERSE] ) return FORWARD;
	else return REVERSE;
}

void do_mergeprocess( const int ovl_loc, READ F_read, READ R_read, READ &MR_read ){
	READ   MF_read=F_read;
	MR_read = R_read;
	const int    length = F_read.seq.size();
	int    diff_qvl;
	int    side;

	MR_read.seq.insert( 0, F_read.seq.substr(0,ovl_loc) );
	MR_read.qvl.insert( 0, F_read.qvl.substr(0,ovl_loc) );
  int t_len = MR_read.seq.size();
	int diff_len = t_len-length;
  MF_read.seq.insert( length, MR_read.seq.substr(length,diff_len) );
  MF_read.qvl.insert( length, MR_read.qvl.substr(length,diff_len) );

	for( int i=ovl_loc; i<length; i++ ) {
		diff_qvl = MF_read.qvl[i] - MR_read.qvl[i];
		if( MF_read.seq[i] != MR_read.seq[i] ) {
			if( abs(diff_qvl) < THRD_QVLDIFF ) {	// See the K-mer TBL
				side = full_kmerscan( i, MF_read.seq, MR_read.seq, length );
				if( side==FORWARD ) {
					MR_read.seq[i] = MF_read.seq[i];
					MR_read.qvl[i] = MF_read.qvl[i];
				}
				else if( side==REVERSE ) {
					MF_read.seq[i] = MR_read.seq[i];
					MF_read.qvl[i] = MR_read.qvl[i];
				}
				else if( side==NOTBOTH ) {
					MR_read.seq=MR_read.qvl="";
					return;
				}
			}
			else if( diff_qvl > 0 ) {	// set as Forward Side
				MR_read.seq[i] = MF_read.seq[i];
				MR_read.qvl[i] = MF_read.qvl[i];
			}
			else if( diff_qvl < 0 ) {	// set as Reverse Side
				MF_read.seq[i] = MR_read.seq[i];
				MF_read.qvl[i] = MR_read.qvl[i];
			}
			// if( diff_qvl==0 ) already Reverse Side
		}
		else if( diff_qvl > 0 ) MR_read.qvl[i] = MF_read.qvl[i];
	}

	return;
}


int get_overlappingregion( const READ &F_read, const READ &R_read ){
	string temp_revseq=R_read.seq;	
	size_t mismatch_cnt;
	size_t best_loc=0;
	float  mismatching_ratio, best_ratio=1.0;
	size_t f_len = F_read.seq.size();
	size_t r_len = R_read.seq.size();

	for( size_t i=0; i<=(f_len-MINOVERLAP); i++ ) {
		mismatch_cnt=0;
		for( size_t j=i; j<f_len; j++ ) {
			if( F_read.seq[j] != temp_revseq[j] ) mismatch_cnt++;
		}
		mismatching_ratio = (float) mismatch_cnt / (f_len-i) ;

		if( mismatching_ratio < best_ratio ) {
			best_ratio    = mismatching_ratio;
			best_loc      = i;
		}
		else if( mismatching_ratio == best_ratio ) {
			// need to additional handle
		}
		temp_revseq.insert(0, " ") ;
	} //end of for i

//	if( best_loc > length ) return -1;
	if( best_loc+r_len < f_len ) return -1;

	if( best_ratio>THRD_GIVEUP ) return -1;

	return best_loc;
}


/*----------------------------------------------------
 Get Reads Data from FASTQ (forward, reverse) file
-----------------------------------------------------*/
void handle_inputfile( char **argv ) {
	timeval  start, finish, elapsed;
	ifstream for_fp, rev_fp;
	string   data;
	READ     F_read, R_read;

	gettimeofday(&start, NULL);

	open_inputfile( for_fp, argv[0] );
	open_inputfile( rev_fp, argv[1] );


	// Forward File
	while( getline(for_fp, data) ) {
		check_firstline( data );
		seqid.push_back( data );
		getline(for_fp, F_read.seq);
		getline(for_fp, data);
		getline(for_fp, F_read.qvl);
		FREAD.push_back(F_read);
	}

	// Reverse File need -SEQ:REV&COMP, -QVL:REV
	while( getline(rev_fp, data) ) {
		getline(rev_fp, data);
		R_read.seq = reverse_complement( data );
		getline(rev_fp, data);
		getline(rev_fp, data);
		R_read.qvl = reverse( data );
		RREAD.push_back(R_read);
	}

	gettimeofday(&finish, NULL);
	timersub(&finish, &start, &elapsed);
	if( F_DBG ) printf("     -  TIME for input handle : %ld.%03ld sec \n", elapsed.tv_sec, elapsed.tv_usec/1000 );

	if( FREAD.size() != RREAD.size() ) {
    printf("[Error] Total number of Reads are different in F(%ld) and R(%ld)\n", FREAD.size(), RREAD.size() );
		exit(EXIT_FAILURE);
	}

	for_fp.close();
	rev_fp.close();
}


void make_kmerindex_jellyfish( string filename, int flag ) {
	string       command="", common_cmd="";
	string       jellyfile="", jellytmpfile="", jellytxtfile="";
	stringstream ss1, ss2;
	ifstream     kmer_fp;
	string       data, kmer_index;
	int          kmer_count;
	int          result;

	// jellyfish count
	ss1 << NUM_THREAD;
	ss2 << KMERSIZE;
	command  = "jellyfish count -m "+itoa(KMERSIZE)+" -L "+ itoa(KMER_LOWER_LIMIT) +
	           " -o "+PREFIX+"jellykmer "
//             "-c 3 -s 100 -t "+itoa(NUM_THREAD)+" "+filename;
             "-c 3 -s 10M -t "+itoa(NUM_THREAD)+" "+filename;
	cout << "     -  " << command << endl;
	result = system( command.c_str() );

	// jellyfish merge
	jellyfile    = PREFIX+"jellykmer";
	/*
	jellytmpfile = jellyfile + "_1";
	ifstream f( jellytmpfile.c_str() );
	// DEBUG kwonsy jellyfile merge --> jellyfish
	if( f.good() ) command = "jellyfish merge -o "+jellyfile+" "+jellyfile+"_*";
	else command = "mv "+jellyfile+"_0 "+jellyfile;
	result = system( command.c_str() );
	f.close();
	*/

	// jellyfish dump
	jellytxtfile = jellyfile+".txt";
	command = "jellyfish dump -c "+jellyfile+" > "+jellytxtfile;
	result = system( command.c_str() );

	if( F_DBG ) {
		system("wc -l casperjellykmer.txt");
		printf("[DBG]     -  jellyfish K-mer table size : %ld\n", KMER_TBL.size() );
	}
	// Read jellyfish K-mer result
	open_inputfile( kmer_fp, jellytxtfile.c_str() );
	if( flag==FORWARD ) {
		while( getline(kmer_fp, data) ) {
			kmer_index = data.substr( 0, KMERSIZE );
			kmer_count = atoi( data.substr( KMERSIZE+1 ).c_str() );
			KMER_TBL[ kmer_index ] += kmer_count;
		}
	}
	else {
		while( getline(kmer_fp, data) ) {
			kmer_index = reverse_complement( data.substr( 0, KMERSIZE ) );
			kmer_count = atoi( data.substr( KMERSIZE+1 ).c_str() );
			KMER_TBL[ kmer_index ] += kmer_count;
		}
	}
	command = "rm "+jellyfile+"*";
	result= system( command.c_str() );

	kmer_fp.close();
}

void use_jellyfish( char **argv ) {
	timeval  start, finish, elapsed;
	gettimeofday(&start, NULL);

	printf("\n  K-mers : Jellyfish\n");
	make_kmerindex_jellyfish( argv[0], FORWARD );
	make_kmerindex_jellyfish( argv[1], REVERSE );

	gettimeofday(&finish, NULL);
	timersub(&finish, &start, &elapsed);
	if( F_DBG ) {
		printf("     -  jellyfish K-mer table size : %ld\n", KMER_TBL.size() );
		printf("     -  TIME for Jellyfish         : %ld.%03ld sec \n", elapsed.tv_sec, elapsed.tv_usec/1000 );
	}

#ifdef	KMER_WRITE
	ofstream kmer_out_fp;
	unordMap::iterator itrt_kmer;
	open_outputfile( kmer_out_fp, PREFIX+"_jellyfish_kmer" );
	for( itrt_kmer=KMER_TBL.begin(); itrt_kmer!=KMER_TBL.end(); itrt_kmer++ ) {
		kmer_out_fp << itrt_kmer->first << " " << itrt_kmer->second << endl;
	}
	kmer_out_fp.close();
#endif
}

void make_kmertbl( const string &seq, unordMap &omp_kmer_tbl ) {
	for( size_t i=0; i<=(seq.size()-KMERSIZE); i++ ) {
		omp_kmer_tbl[ seq.substr(i,KMERSIZE) ] += 1;
	}
}

/*----------------------------------------------------
	 Make K-mer table 
-----------------------------------------------------*/
void make_kmerindex() {
	timeval  start, finish, elapsed;

	gettimeofday(&start, NULL);

	unordMap *omp_kmer_tbl[NUM_THREAD];
	unordMap  all_kmer_tbl;
	unordMap::iterator itrt_kmer;

/*
	// for atomic
	int      temp=0;
	int      datasize = FREAD.size();
	size_t   idx, i, iii[2]={0,0};

	#pragma omp parallel for
	for( idx=0; idx<datasize; idx++ ) {
		for( i=0; i<=(FREAD[idx].seq.size()-KMERSIZE); i++ ) {
			#pragma omp atomic
//				iii[1]++;
			all_kmer_tbl[ FREAD[idx].seq.substr(i,KMERSIZE) ]++;
		}
	}
//			#pragma omp critical
*/



	#pragma omp parallel
	{
		int      thr_id = omp_get_thread_num();
		omp_kmer_tbl[thr_id] = new unordMap;

		#pragma omp for
		for( size_t idx=0; idx<FREAD.size(); idx++ ) {
			make_kmertbl( FREAD[idx].seq, *omp_kmer_tbl[thr_id] );
			make_kmertbl( RREAD[idx].seq, *omp_kmer_tbl[thr_id] );
		//	make_kmertbl( FREAD[idx].seq, all_kmer_tbl );
		//	make_kmertbl( RREAD[idx].seq, all_kmer_tbl );
		}

		#pragma omp master
		{
			for( int i=0; i<NUM_THREAD; i++ ) {
				for( itrt_kmer=omp_kmer_tbl[i]->begin(); itrt_kmer!=omp_kmer_tbl[i]->end(); itrt_kmer++ ) {
					//KMER_TBL[ itrt_kmer->first ] += itrt_kmer->second;
					all_kmer_tbl[ itrt_kmer->first ] += itrt_kmer->second;
				}
			}
		}
		#pragma omp barrier
		delete omp_kmer_tbl[thr_id];
	}


	for( itrt_kmer=all_kmer_tbl.begin(); itrt_kmer!=all_kmer_tbl.end(); itrt_kmer++ ) {
		if( itrt_kmer->second >= KMER_LOWER_LIMIT ) {
			if( itrt_kmer->first.find("N") != std::string::npos ) continue;
			KMER_TBL[ itrt_kmer->first ]  = itrt_kmer->second;
		}
	}
	printf("\n  K-mers : Internal naive k-mer counter\n");
	if( F_DBG ) printf("     -  K-mer table size           : %ld\n", KMER_TBL.size() );
	all_kmer_tbl.clear();

#ifdef	KMER_WRITE
	ofstream kmer_out_fp;
	open_outputfile( kmer_out_fp, PREFIX+"_kmer" );
	for( itrt_kmer=KMER_TBL.begin(); itrt_kmer!=KMER_TBL.end(); itrt_kmer++ ) {
		kmer_out_fp << itrt_kmer->first << " " << itrt_kmer->second << endl;
	}
	kmer_out_fp.close();
#endif

	gettimeofday(&finish, NULL);
	timersub(&finish, &start, &elapsed);
	if( F_DBG ) printf("     -  TIME for K-mer handle      : %ld.%03ld sec \n", elapsed.tv_sec, elapsed.tv_usec/1000 );
}

void write_result( ofstream & fp, const string &seqid, const READ & outREAD ) {
	fp << seqid << endl;
	fp << outREAD.seq << endl;
	fp << "+" << endl;
	fp << outREAD.qvl << endl;
}

/*-----------------------------------------------------
	Do the real merging
		(1) Find the overlapping region
		(2) Choose the right base if mismatch occurs
-----------------------------------------------------*/
void do_merging() {
	timeval start, finish, elapsed;
	int     totalreads = FREAD.size();
	READ    temp;
	int     left_cnt=0, mg_cnt=0;
	READ  * MREAD = new READ[totalreads];

	gettimeofday(&start, NULL);

//	#pragma omp parallel for
	for( int i=0; i<totalreads; i++ ) {
		int ovl_loc  = get_overlappingregion( FREAD[i], RREAD[i] );
		if( ovl_loc < 0 ) MREAD[i].seq = "";
		else {
			do_mergeprocess( ovl_loc, FREAD[i], RREAD[i], MREAD[i] );
		}
		if( F_DBG && (i%100000==0) ) printf("\nseq:%d completed", i );
	}

	gettimeofday(&finish, NULL);
	timersub(&finish, &start, &elapsed);
	if( F_DBG ) printf("     -  TIME for merging              : %ld.%03ld sec \n", elapsed.tv_sec, elapsed.tv_usec/1000 );


//-------------------------------------------------------
	gettimeofday(&start, NULL);

	ofstream out_fp;
	ofstream Fleft_fp, Rleft_fp ;
	open_outputfile( out_fp, PREFIX+".fastq" );
	if( F_READSLEFT == true ) { 
		open_outputfile( Fleft_fp, PREFIX+"_for_left.fastq" );
		open_outputfile( Rleft_fp, PREFIX+"_rev_left.fastq" );
	}

	for( int i=0; i<totalreads; i++ ) {
		// for Write of Merged Reads
		if( MREAD[i].seq !="" ) {
			write_result( out_fp, seqid[i], MREAD[i] );
		}
		// for LEFT
		else {
			left_cnt++;
			if( F_READSLEFT == true ) { 
				write_result( Fleft_fp, seqid[i], FREAD[i] );
				temp.seq = reverse_complement( RREAD[i].seq );
				temp.qvl = reverse( RREAD[i].qvl );
				write_result( Rleft_fp, seqid[i], temp );
			}
		}
	}
	out_fp.close();
	if( F_READSLEFT == true ) { 
		Fleft_fp.close();
		Rleft_fp.close();
	}

	gettimeofday(&finish, NULL);
	timersub(&finish, &start, &elapsed);
//-------------------------------------------------------
	if( F_DBG ) printf("     -  TIME for writing output       : %ld.%03ld sec \n", elapsed.tv_sec, elapsed.tv_usec/1000 );

	mg_cnt = totalreads-left_cnt;
	printf("\n  Merging Result Statistics\n");
	printf("     -  Total number of reads     : %10d\n", totalreads);
	printf("     -  Number of merged reads    : %10d (%2.2f%%)\n", mg_cnt, totalreads ?  
	                                   (float)mg_cnt*100/totalreads : 0 );
	printf("     -  Number of unmerged reads  : %10d (%2.2f%%)\n", left_cnt, totalreads ?
	                                   (float)left_cnt*100/totalreads : 0 );

	delete [] MREAD;
}

