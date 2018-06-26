####################################################
### Script to add properties from original       ###
### .json file graph and add them to newly       ###
### coarsened graphs.                            ###
### Author: Diego Cintra                         ###
### Date: 8 may 2018                             ###
####################################################

import argparse
import json
import os
import sys

# Converts a float character to string, assigning "0" if float is 0.0.
# @param {float} num Floating point number to be converted.
# @returns {string} Corresponding number in string; if float is 0.0, "0" is returned.
def convert2String(num):
    if(num == 0.0):
        return "0"
    else:
        return ''.join(str(num).split("."))

if __name__ == "__main__":
    # Instantiate argument parser
    description = 'Program to set properties from original .json file graph and add them to newly coarsened graphs.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-f', '--folder', required=True, dest='folder', action='store', type=str, default=None, help='Folder containing all .json files.');
    required.add_argument('-n', '--name', required=True, dest='name', action='store', type=str, default=None, help='Original graph name (appended with \'Coarsened\').');
    required.add_argument('-l', '--nLevels', required=True, dest='nLevels', action='store', type=str, default=None, help='Number of coarsened graphs.');
    required.add_argument('-r', '--rf', required=True, dest='reductionFactor', action='store', type=float, metavar=('float', 'float'), nargs='+', default=None, help='Reduction factor for each layer.')

    # Add arguments to parser
    parser._action_groups.append(required)

    # Run the parser
    options = parser.parse_args()
    # Step 1: Open original .json graph and load .json file into memory #
    originalJson = open(options.folder + options.name, 'r')
    originalGraph = json.load(originalJson)
    originalJson.close()
    # Step 2: Give file new name #
    reductionFactor1 = convert2String(options.reductionFactor[0])
    reductionFactor2 = convert2String(options.reductionFactor[1])
    # fileName = options.name.split(".")[0] + "Coarsened" + "l" + reductionFactor1 + 'r' + ''.join(str(options.reductionFactor[1]).split("."))
    fileName = options.name.split(".")[0] + "Coarsened" + "l" + reductionFactor1 + 'r' + reductionFactor2
    # Step 3: Iterate through all coarsened graphs and write new properties to .json file #
    for level in range(1, int(options.nLevels)+1):
        coarsenedFileName = fileName + "n" + str(level) + ".json"
        # Step 3.1: Open coarsened .json graph #
        coarsenedJson = open(options.folder + coarsenedFileName, 'r')
        coarsenedGraph = json.load(coarsenedJson)
        coarsenedJson.close()
        # Step 3.2: Iterate through every node of .json file and create array of vertexes, composing super-vertex #
        for node in coarsenedGraph['nodes']:
            # Create a list of concatenated vertexes
            node['vertexes'] = []
            for source in node['source'].split(","):
                node['vertexes'].append(originalGraph['nodes'][int(source)])
        # Step 3.3: Open a new .json file for writing
        # newCoarsenedJson = open(options.folder + fileName + "n" + str(level) + "Weighted.json", 'w')
        newCoarsenedJson = open(options.folder + fileName + "n" + str(level) + ".json", 'w')
        # Write graph info
        newCoarsenedJson.write("{\n\t\"graphInfo\":\n")
        json.dump(coarsenedGraph['graphInfo'], newCoarsenedJson, indent=4, sort_keys=True)
        # Write nodes
        newCoarsenedJson.write(",\n\t\"nodes\":\n")
        json.dump(coarsenedGraph['nodes'], newCoarsenedJson, indent=4, sort_keys=True)
        # Write links
        newCoarsenedJson.write(",\n\t\"links\":\n")
        json.dump(coarsenedGraph['links'], newCoarsenedJson, indent=4, sort_keys=True)
        # Finish writing JSON file
        newCoarsenedJson.write("\n}")
        newCoarsenedJson.close()
