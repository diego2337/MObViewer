####################################################################################
# Simple program to convert .json file to .ncol, required as input for coarsening. #
# Author: Diego Silva Cintra                                                       #
# Date: 23 november 2017                                                           #
####################################################################################
import argparse

if __name__ == "__main__":
    # Instantiate argument parser
    description = 'Program to convert .json file to .ncol format (used in igraph).'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-i', '--input', required=True, dest='input', action='store', type=str, deafult=None, help='.json input file name.');
    required.add_argument('-o', '--output', required=True, dest='output', action='store', type=str, deafult=None, help='.ncol output file name.');

    # Add optional arguments with new group
    # optional = parser.add_argument_group('optional arguments')
    # optional.add_argument('')
    # optional

    # Step 1 - Open .json file for reading, and .ncol for writing
    jsonFile = open(sys.argv[1], 'r')
    ncolFile = open(sys.argv[2], 'w+')
    # Step 2 - Iterate through file
    for line in jsonFile:
        # Boolean to indicate that "links" object has been acessed
        linkObject = False
        # Step 3 - Write "source", "target" and "weight" to .ncol file
        if "\"source\"" in line:
            linkObject = True
            linha = line.split(" ")
            ncolFile.write(linha[-1])
        elif "\"target\"" in line:

        elif "\"weight\"" in line and linkObject == True:
