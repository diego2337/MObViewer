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

    # Add argument groups (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-i', '--input', required=True, )
    # Step 1
