#include <fstream>
#include <iostream>
#include <cstring>
#include <cstdlib>
#include <sstream>

#define RESET     "\e[0m"
#define BOLD      "\e[1m"
#define UNDERLINE "\e[4m"

using namespace std;

/*------------------------------------------------
	A->T, C->G, G->C, T->A, N->N
------------------------------------------------*/
const unsigned char base_complement[128] = {
	'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N',
	'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N',
	'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N',
	'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N',
	'N', /*A*/ 'T', 'N', /*C*/ 'G', 'N', 'N', 'N', /*G*/ 'C', 'N', 'N', 'N', 'N', 'N', 'N', /*N*/'N', 'N',
	'N', 'N', 'N', 'N', /*T*/ 'A', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N',
	'N', /*a*/ 't', 'N', /*c*/ 'g', 'N', 'N', 'N', /*g*/ 'c', 'N', 'N', 'N', 'N', 'N', 'N', /*n*/'n', 'N',
	'N', 'N', 'N', 'N', /*t*/ 'a', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'
};

extern void open_inputfile( ifstream &fp, const char *filename ); 
extern void open_outputfile( ofstream &fp, const string & filename );
extern void check_firstline( const string &data );
extern string itoa( const int number );

// Reverse a string
static inline string reverse( const string &ori_str ) {
  string rev_str="";

  for( int i=ori_str.size()-1; i>=0; i-- )
    rev_str += ori_str[i];
  return rev_str;
}

// Reverse & Complement a string
static inline string reverse_complement(const string &ori_str ) {
  string rev_str="";

  for( int i=ori_str.size()-1; i>=0; i-- )
    rev_str += base_complement[ (unsigned char)ori_str[i] ];
  return rev_str;
}



