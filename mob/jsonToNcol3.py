####################################################################################
# Simple program to convert .json file to .ncol, required as input for coarsening. #
# Author: Diego Silva Cintra                                                       #
# Date: 23 november 2017                                                           #
####################################################################################
import argparse

# @desc Removes any unnecessary characters from line, defined by 'junkCharacters', returning a new line.
# @param {String} line Line to be checked.
# @param {List} junkCharacters Array of 'junk' characters to be cleared from line.
# @returns {String} New line with no junk characters.
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

# @desc Check if a variable is a int or not - from https://stackoverflow.com/questions/354038/how-do-i-check-if-a-string-is-a-number-float
# @param {(int|string)} var Variable to be checked.
# @returns {Boolean} True if variable is a int, zero otherwise.
def isNumber(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

# @desc Checks to see if list has number, and returns it.
# @param {List} l List of elements to be checked.
# @returns {(Number|Int)} Element in list which is a number, -1 otherwise.
def listHasNumber(l):
    for element in l:
        if(isNumber(element)):
            return str(element)
    return -1

if __name__ == "__main__":
    # Instantiate argument parser
    description = 'Program to convert .json file to .ncol format (used in igraph).'
    parser = argparse.ArgumentParser(description=description)
    parser._action_groups.pop()

    # Add argument group (required)
    required = parser.add_argument_group('required arguments')
    required.add_argument('-i', '--input', required=True, dest='input', action='store', type=str, default=None, help='.json input file name.');
    required.add_argument('-o', '--output', required=True, dest='output', action='store', type=str, default=None, help='.ncol output file name.');

    # Run the parser
    options = parser.parse_args()

    # Step 1 - Open .json file for reading, and .ncol for writing
    jsonFile = open(options.input, 'r')
    ncolFile = open(options.output, 'w+')
    # Boolean to indicate that "links" object has been acessed
    linkObject = False
    junkCharacters = [chr(9), '\n', '\r', '\"', ',']
    # Step 2 - Iterate through file
    for line in jsonFile:
        if "\"links\":" in line:
            linkObject = True
        # Step 3 - Write "source", "target" and "weight" to .ncol file
        if(linkObject == True):
            if "\"source\"" in line:
                # linkObject = True
                # linha = line.split(" ")
                l = removeTrash(line, junkCharacters).split(" ")
                if(listHasNumber(l) != -1):
                    ncolFile.write(listHasNumber(l))
                # ncolFile.write(linha[-2][:-1])
                # ncolFile.write(linha[-1].split("\"")[1])
                ncolFile.write(" ")
            elif "\"target\"" in line:# and linkObject == True:
                # linha = line.split(" ")
                l = removeTrash(line, junkCharacters).split(" ")
                if(listHasNumber(l) != -1):
                    ncolFile.write(listHasNumber(l))
                # ncolFile.write(linha[-2][:-1])
                # ncolFile.write(linha[-1].split("\"")[1])
                ncolFile.write(" ")
            elif "\"weight\"" in line:# and linkObject == True:
                l = removeTrash(line, junkCharacters).split(" ")
                if(listHasNumber(l) != -1):
                    ncolFile.write(listHasNumber(l))
                # ncolFile.write(linha[-1][:-1])
                # ncolFile.write(linha[-1].split("\"")[1])
                ncolFile.write("\n")
                # linkObject = False
    # Step 4 - Close files
    jsonFile.close()
    ncolFile.close()
