###################################################################################
# Simple program to list all graphs in a given directory, and get most coarsened  #
# bipartite graph.                                                                #
# Author: Diego Silva Cintra                                                      #
# Date: 11 august 2018                                                            #
###################################################################################
import argparse
import glob
import os

if __name__ == "__main__":
    # Instantiate argument parser
    description = 'Program to list all .json graphs in a given directory, and get most coarsened bipartite graph.'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-i', '--input', required=True, dest='input', action='store', type=str, default=None, help='.json input file name.');
    required.add_argument('-d', '--directory', required=True, dest='directory', action='store', type=str, default=None, help='Directory to list files from.');

    # Run the parser
    options = parser.parse_args()

    # Step 1 - List all bipartite graphs - from https://stackoverflow.com/questions/22154818/python-check-all-file-with-a-specific-name-in-a-directory
    os.chdir(options.directory + "/")
    lst = glob.glob(options.input + "*.json")

    # Step 2 - Check for most coarsened file
    reductionFactor = ''
    graphName = ''
    nl = nr = 0
    for graph in lst:
        if(graph.find("nl") != -1):
            if(reductionFactor is ''):
                # reductionFactor = lst[0].split("Coarsened")[1].split("nl")[0]
                # graphName = lst[0].split("Coarsened")[0] + "Coarsened"
                reductionFactor = graph.split("Coarsened")[1].split("nl")[0]
                graphName = graph.split("Coarsened")[0] + "Coarsened"
            levels = graph.split(".")[0].split("nl")[1].split("nr")
            if(int(levels[0]) > nl):
                nl = int(levels[0])
            if(int(levels[1]) > nr):
                nr = int(levels[1])

    # Step 3 - Print out most coarsened graph level
    print graphName + reductionFactor + "nl" + str(nl) + "nr" + str(nr) + ".json"
        # print graph
