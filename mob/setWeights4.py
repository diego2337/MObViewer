####################################################
### Script to add proper weights from original   ###
### .json file graph and add them to newly       ###
### coarsened graph.                             ###
### Author: Diego S. Cintra                      ###
### Date: 27 april 2018                          ###
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
        if(clusteredVertices[-1][-1] == '\n'):
            clusteredVertices[-1] = clusteredVertices[-1][:-1]
    clusterJson.close()

    # Step 2 - Save .json file in memory #
    jason = json.load(originalJson)
    originalJson.close()

    weights = []
    # Step 3 - For every item in clusteredVertices, find its weight in originalJson and add it #
    for i in range(len(clusteredVertices)): # "i" corresponds to clustered vertice
        weights.append(0.0)
        for j in range(len(clusteredVertices[i].split(" "))):
            if('weight' in jason['nodes'][int(clusteredVertices[i].split(" ")[j])]):
                weights[i] = weights[i] + float(jason['nodes'][int(clusteredVertices[i].split(" ")[j])]['weight'])
            else:
                weights[i] = weights[i] + 1.0
    # print weights

    # Step 4 - load coarsened .json file in memory, open newCoarsenedJson, and start writing .json with new weights #
    coarsenedJason = json.load(coarsenedJson)
    # Store graphInfo
    newCoarsenedJson.write("{\n\t\"graphInfo\":\n")
    json.dump(coarsenedJason['graphInfo'], newCoarsenedJson, indent=4, sort_keys=True)
    # Eliminate old nodes information
    del coarsenedJason['nodes']
    # Create a list of dictionaries, so nodes information can be stored
    nodes = []
    # newCoarsenedJson.write(",\n\t\"nodes\":\n\t[")
    newCoarsenedJson.write(",\n\t\"nodes\":\n")
    # Start writing new nodes with respective weights
    for i in range(len(clusteredVertices)): # "i" corresponds to clustered vertice
        for j in range(len(clusteredVertices[i].split(" "))):
            if(j == 0): # First node is id node; for every first node, store a property called "vertexes", containing array of concatenated vertexes
                nodes.append(dict())
                # writingLine = json.dumps(jason['nodes'][int(clusteredVertices[i].split(" ")[j])], indent=4, sort_keys=True)
                nodes[i]['id'] = str(clusteredVertices[i].split(" ")[j])
                nodes[i]['weight'] = str(weights[i])
                # Create a list of concatenated vertexes
                nodes[i]['vertexes'] = []
                # coarsenedJason['nodes'][i]['id'] = j
                # coarsenedJason['nodes'][i]['weight'] = weights[i]
                # coarsenedJason['nodes'][i]['vertexes'] = ""
                nodes[i]['vertexes'].append(jason['nodes'][int(clusteredVertices[i].split(" ")[j])])
            else:
                nodes[i]['vertexes'].append(jason['nodes'][int(clusteredVertices[i].split(" ")[j])])
                # coarsenedJason['nodes'][i]['vertexes'] = jason['nodes'][int(clusteredVertices[i].split(" ")[j])]
                # print json.dumps()
    # Assign node information to dictionary structure
    coarsenedJason['nodes'] = nodes
    # Store nodes
    json.dump(coarsenedJason['nodes'], newCoarsenedJson, indent=4, sort_keys=True)
    # newCoarsenedJson.write("\n\t]")
    # Store links
    # newCoarsenedJson.write(",\n\t\"links\":\n\t[")
    newCoarsenedJson.write(",\n\t\"links\":\n")
    json.dump(coarsenedJason['links'], newCoarsenedJson, indent=4, sort_keys=True)
    # newCoarsenedJson.write("\n\t]")
    # Finish writing JSON file
    newCoarsenedJson.write("\n}")

    # Step 5 - Close files and exit program cleanly #
    coarsenedJson.close()
    newCoarsenedJson.close()
