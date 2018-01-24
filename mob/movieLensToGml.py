# Simple script to convert "movieLens" datasets to ".gml" format.
# Author: Diego S. Cintra
# Date: 31/07/2017

# Regex
# The following notations are used:
# (O): indicates optional argument
# [number]: indicates that only number can be used
# [number1-number2]: only numbers from number1 to number2, both inclusive, can be used
# [number1-...]: any number starting from number1 can be used
# "": must be encapsulated in double quotes
# anyString: anyString must be specified

# Format
# ".gml" files have following format:
# "
# graph
# [
#   directed 0-1
#   vlayer "[0-...] [0-...]", where first number indicates how many vertexes are in first set, and second number how many vertexes in second set
#   nlayers "[0-...]", number of graph layers, if it's either bipartite, tripartite, etc.
#   (O) level "[0-...]", multilevel paradigm level
#   node
#   [
#       id [0-...]
#       (O) weight [0-...]
#   ]
#   .
#   .
#   .
#   edge
#   [
#       source [0-...]
#       target [0-...]
#       weight [0-...]
#   ]
# ]
# "

import sys
import os
import re
import random

# Usage:
# python movieLens.dat yourFileName.gml fileFormat
# fileFormat: 1 for ".tsv", 2 for ".csv"
#
if __name__ == '__main__':
    # Variable declarations #
    # Tuple containing all edges
    edges = []
    # Contains number of users
    maxUsers = 0
    # Contains number of movies
    maxMovies = 0
    # Step 1: Open movieLensFile for reading and .json file for writing, and specify if input file is either ".csv" or ".tsv" #
    movieLensFile = open(sys.argv[1], 'r')
    jsonFile = open(sys.argv[2], 'w+')
    fileFormat = sys.argv[3]

    if(int(fileFormat) == 1):
        fileFormat = "\t"
    elif(int(fileFormat) == 2):
        fileFormat = ","

    # Step 2: Count number of elements from each layer # 
    for line in movieLensFile:
        linha = line.split(fileFormat)
        if(maxUsers <= linha[0]):
            maxUsers = linha[0]
        if(maxMovies <= linha[1]):
            maxMovies = linha[1]
    # Step 2.1: Rewind file #
    movieLensFile.seek(0, 0)

    # Step 3: Write initial information from ".gml" file - See section "Format" for more info #
    jsonFile.write("graph\n[\n\t")
    jsonFile.write("directed 0\n\t")
    # NOTE - "vlayer" will only be adjusted at the end, after obtaining information regarding number of elements from each set
    # jsonFile.write("vlayer \"0 0\"\n\t")
    jsonFile.write("vlayer \"")
    jsonFile.write(maxUsers)
    jsonFile.write(" ")
    jsonFile.write(maxMovies)
    jsonFile.write("\"\n\t")
    jsonFile.write("nlayers \"2\"\n\t")
    jsonFile.write("level \"0\"\n\t")
    # Step 4: Write node entry, storing "edge" information #
    for line in movieLensFile:
        linha = line.split(fileFormat)
	# print "aqui a linha"
	# print linha
	# print "acabou a linha"
        # Step 4.1: Write node from first column (users) #
        jsonFile.write("node\n\t[\n\t\t")
        jsonFile.write("id ")
        jsonFile.write(linha[0])
        jsonFile.write("\n\t]\n\t")

        # Step 4.2: Write node from second column (movies) #
        jsonFile.write("node\n\t[\n\t\t")
        jsonFile.write("id ")
        jsonFile.write(linha[1])
        jsonFile.write("\n\t]\n\t")

        # Step 4.3: Store nodes and edge weight as triplets #
        edges.append((linha[0], linha[1], linha[2]))

    # Step 5: Write edge entry from "edges" variable #
    for edge in edges:
        jsonFile.write("edge\n\t[\n\t\t")
        # Step 5.1: Write "source" vertex #
        jsonFile.write("source ")
        jsonFile.write(edge[0])
        jsonFile.write("\n\t\t")

        # Step 5.2: Write "target" vertex #
        jsonFile.write("target ")
        jsonFile.write(edge[1])
        jsonFile.write("\n\t\t")

        # Step 5.3: Write edge weight #
        jsonFile.write("weight ")
        jsonFile.write(edge[2])
        jsonFile.write("\n\t]\n\t")

    # Step 7: Finish ".json" file and close both files #
    jsonFile.write("]")
    jsonFile.close()
    movieLensFile.close()
