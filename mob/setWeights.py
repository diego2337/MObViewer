####################################################
### Script to add proper weights to original     ###
### .json file graph and add them to newly       ###
### coarsened graph.
### Author: Diego S. Cintra                      ###
### Date: 21/02/2018                             ###
####################################################

import argparse
import os

# Removes any unnecessary characters from line, defined by 'junkCharacters', returning a new line.
def removeTrash(line, junkCharacters):
    firstOccurenceOfWord = False
    space = False
    newLine = []
    i = 0
    while i < len(line):
        if(junkCharacters.count(line[i]) == 0):
            if(not firstOccurenceOfWord):
                firstOccurenceOfWord = True
            if(space):
                newLine.append(' ')
                space = False
            newLine.append(line[i])
        else:
            if(firstOccurenceOfWord):
                space = True
        i = i + 1
    return ''.join(newLine)

# Find file position corresponding to vertex and return its weight.
def findVerticeWeight(arquivo, vertice):
    junkCharacters = [chr(9), ' ', '\n', '\r', '\"', ',']
    line = arquivo.readline()
    while(line != ""):
        line = removeTrash(line, junkCharacters)
        if(line.split(" ")[0] == "id" and int(line.split(" ")[-1]) == vertice):
            while(line != "" and line.split(" ")[0] != "}" and line.split(" ")[0] != "weight"):
                line = arquivo.readline()
                line = removeTrash(line, junkCharacters)
            # If line has closing brace, it means no weight was found; use 1.0 for weight
            if(line.split(" ")[0] != "}"):
                return float(line.split(" ")[-1])
            else:
                return 1.0
        line = arquivo.readline()
    return 1.0


if __name__ == "__main__":
    # Instantiate argument parser
    description = 'Program to add proper weights to original .json file graph and add them to newly coarsened graph.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-o', '--original', required=True, dest='original', action='store', type=str, default=None, help='Original .json input file name.');
    required.add_argument('-c', '--coarsened', required=True, dest='coarsened', action='store', type=str, default=None, help='.json coarsened file name.');
    required.add_argument('-g', '--cluster', required=True, dest='cluster', action='store', type=str, default=None, help='.cluster file name containing newly grouped vertices.');

    # Add arguments to parser
    parser._action_groups.append(required)

    # Run the parser
    options = parser.parse_args()

    # Step 1 - Open files #
    originalJson = open(options.original, 'r')
    coarsenedJson = open(options.coarsened, 'r')
    newCoarsenedJson = open(options.coarsened.split(".")[0]+"Weighted.json", 'w')
    clusterJson = open(options.cluster, 'r')

    # Step 2 - Save clustered vertices in array #
    clusteredVertices = []
    for line in clusterJson:
        clusteredVertices.append(line)
        clusteredVertices[-1] = clusteredVertices[-1][:-1]
    clusterJson.close()

    weight = []
    # Step 3 - For every item in clusteredVertices, find its weight in originalJson and add it #
    for i in range(len(clusteredVertices)): # "i" corresponds to clustered vertice
        weight.append(0)
        for j in range(len(clusteredVertices[i].split(" "))):
            # print clusteredVertices[i].split(" ")[j]
            # junkCharacters = [chr(9), ' ', '\n', '\r', '\"', ',']
            originalJson.seek(i)
            weight[-1] = weight[-1] + findVerticeWeight(originalJson, int(clusteredVertices[i].split(" ")[j]))
            print weight

    # Step 4 - open newCoarsenedJson, and start writing .json with new weights #
    junkCharacters = [chr(9), ' ', '\n', '\r', '\"', ',']
    i = 0
    line = coarsenedJson.readline()
    while(line != ""):
        if(removeTrash(line, junkCharacters).split(" ")[0] == "id"):
            newCoarsenedJson.write(line)
            line = coarsenedJson.readline()
            while(line != "" and removeTrash(line, junkCharacters).split(" ")[0] != "weight"):
                newCoarsenedJson.write(line)
                line = coarsenedJson.readline()
            # weight found: write new weight
            newCoarsenedJson.write("\t\t\"weight\": \"" + str(weight[i]) + "\"\n")
            line = coarsenedJson.readline()
            i = i + 1
        newCoarsenedJson.write(line)
        line = coarsenedJson.readline()

    # Step 5 - Close files and exit program cleanly #
    originalJson.close()
    coarsenedJson.close()
    newCoarsenedJson.close()

    os._exit(1)
