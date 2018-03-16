
using namespace std;

#define FORWARD           1
#define REVERSE           2
#define NOTBOTH           0
#define VERSION           "v0.8.2"
#define PROGNAME          "CASPER"

/*------------------
  FASTQ file Format
  ------------------
1: @Comment(ID Info)
2: Sequence Info
3: +Comment(ID Info)
4: Quality Score Info
------------------*/
struct READ {
  string seq;
  string qvl;
};

