####################################################
### Script to add proper weights from original   ###
### .json file graph and add them to newly       ###
### coarsened graph.                             ###
### Author: Diego S. Cintra                      ###
### Date: 21/02/2018                             ###
####################################################

import argparse
import json
import os
import sys
from pprint import pprint

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

    # Step 2 - Save .json file in memory #
    jason = json.load(originalJson)
    originalJson.close()
    # estringue = json.dumps(jason['nodes'][101])
    # print estringue.split("{")[-1].split("}")[0]

    # weight = []
    # # Step 3 - For every item in clusteredVertices, find its weight in originalJson and add it #
    # for i in range(len(clusteredVertices)): # "i" corresponds to clustered vertice
    #     weight.append(0)
    #     for j in range(len(clusteredVertices[i].split(" "))):
    #         # print clusteredVertices[i].split(" ")[j]
    #         # junkCharacters = [chr(9), ' ', '\n', '\r', '\"', ',']
    #         originalJson.seek(i)
    #         weight[-1] = weight[-1] + findVerticeWeight(originalJson, int(clusteredVertices[i].split(" ")[j]))
    #         print weight

    # Step 4 - open newCoarsenedJson, and start writing .json with new weights #
    junkCharacters = [chr(9), ' ', '\n', '\r', '\"', ',']
    i = 0
    line = coarsenedJson.readline()
    while(line != ""):
        if(removeTrash(line, junkCharacters).split(" ")[0] == "id"):
            # Store current id
            i = int(removeTrash(line, junkCharacters).split(" ")[-1])
            newCoarsenedJson.write(line)
            # Write additional information from coarsened nodes inside node
            if((clusteredVertices[i].split(" ")[0] is not (clusteredVertices[i].split(" ")[-1]))):
                for item in jason['nodes'][int(clusteredVertices[i].split(" ")[-1])]:
                    jason['nodes'][int(clusteredVertices[i].split(" ")[-1])][item] = jason['nodes'][int(clusteredVertices[i].split(" ")[-1])][item] + "/" + jason['nodes'][int(clusteredVertices[i].split(" ")[0])][item]
            writingLine = json.dumps(jason['nodes'][int(clusteredVertices[i].split(" ")[-1])], indent=4, sort_keys=True)
            writingLine = writingLine.split("{")[-1].split("}")[0]
            writingLine = writingLine[1:-1] + "," + "\n"
            newCoarsenedJson.write(writingLine)
#            for j in range(len(clusteredVertices[i].split(" "))):
#                writingLine = json.dumps(jason['nodes'][int(clusteredVertices[i].split(" ")[j])], indent=4, sort_keys=True)
#                writingLine = writingLine.split("{")[-1].split("}")[0]
#                 if(removeTrash(writingLine, junkCharacters).split(" ")[0] == i):
#                 print "j: " + str(j)
#                writingLine = writingLine[1:-1] + "," + "\n"
#                newCoarsenedJson.write(writingLine)
            line = coarsenedJson.readline()
            while(line != "" and removeTrash(line, junkCharacters).split(" ")[0] != "weight"):
                newCoarsenedJson.write(line)
                line = coarsenedJson.readline()
            # weight found: write new weight
            weight = 0.0
            for j in range(len(clusteredVertices[i].split(" "))):
                if('weight' in jason['nodes'][int(clusteredVertices[i].split(" ")[j])]):
                    # two weights are in vertex
                    if(len(jason['nodes'][int(clusteredVertices[i].split(" ")[j])]['weight'].split("/")) != 1):
                        weight = weight + float(jason['nodes'][int(clusteredVertices[i].split(" ")[j])]['weight'].split("/")[0])
                        weight = weight + float(jason['nodes'][int(clusteredVertices[i].split(" ")[j])]['weight'].split("/")[1])
                    else:
                        weight = weight + float(jason['nodes'][int(clusteredVertices[i].split(" ")[j])]['weight'])
                else:
                    weight = weight + 1.0
            newCoarsenedJson.write("\t\t\"weight\": \"" + str(weight) + "\"\n")
            # newCoarsenedJson.write("\t\t\"weight\": \"" + str(weight[i]) + "\"\n")
            line = coarsenedJson.readline()
        newCoarsenedJson.write(line)
        line = coarsenedJson.readline()

    # Step 5 - Close files and exit program cleanly #
    coarsenedJson.close()
    newCoarsenedJson.close()
