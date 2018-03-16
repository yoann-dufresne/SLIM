CC       := g++
#CFLAGS   := -O2 -Wall -std=c99 -D_GNU_SOURCE -D_FILE_OFFSET_BITS=64
#CFLAGS   := -O2 -Wall -std=c99
CFLAGS   := -O2 -Wall
CPPFLAGS := -fopenmp
SRC      := merge.c util.c
#OBJ      := merge.o util.o
OBJ     := $(SRC:.c=.o)
EXE      := casper 

$(EXE):$(OBJ)
	$(CC) $(CFLAGS) -o $@ $(OBJ) $(CPPFLAGS) 

clean:
	rm -f $(OBJ) $(EXE)

