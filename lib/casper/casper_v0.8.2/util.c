#include 	"util.h"

/*----------------------------------------------------
  Check Open File Stream
-----------------------------------------------------*/
void open_inputfile( ifstream &fp, const char *filename ) {
  fp.open( filename );
  if( fp.fail() ) {
    cout << "Error: Cannot open input file (" << filename << ")" << endl;
    exit(EXIT_FAILURE);
  }
}

/*----------------------------------------------------
  Check Output File Stream
-----------------------------------------------------*/
void open_outputfile( ofstream &fp, const string & filename ) {
  fp.open( filename.c_str() );
  if( fp==NULL ) {
    cout << "Error: Cannot open output file (" << filename << ")" << endl;
    exit(EXIT_FAILURE);
  }
}

/*----------------------------------------------------
  Check FASTQ file  start from '@'
-----------------------------------------------------*/
void check_firstline( const string &data )
{
  if( !data[0]=='@' ) {
    cout << "Error: forward file read data " << endl;
    exit(EXIT_FAILURE);
  }
}


string itoa( const int number ) {
	stringstream s;
	s << number;
	return s.str();
}
