###################################################
### Simple script to convert .gml file to .json ###
###################################################
import sys
import os
import re
import random
# This script was obtained from http://kgullikson88.github.io/blog/pypi-analysis.html

if __name__ == '__main__':
    arquivo = open(sys.argv[1], 'r')
    jason = open(sys.argv[2], 'w+')
    jason.write("{\n")
    imports = []
    names = []
    classes = dict()
    nodeBool = False
    edgeBool = True
    weightBool = False
    twice = False
    two = False
    for line in arquivo:
        two = False
        if "graph" in line and "igraph" not in line:
            jason.write("\"graphInfo\": [\n{\n")
        elif "directed" in line:
            jason.write("\"directed\": \"")
            linha = line.split(" ")
            linha = linha[-1]
            linha = linha[:-1]
            jason.write(linha)
            jason.write("\",\n")
        elif "vertices" in line:
            jason.write("\"vlayer\": \"")
            linha = line.split("\"")
            linha = linha[-2]
            jason.write(linha)
            jason.write("\",\n")
        elif "nlayers" in line:
            jason.write("\"nlayers\": ")
            linha = line.split(" ")
            linha = linha[-1]
            linha = linha[:-1]
            jason.write(linha)
            jason.write(",\n")
        # elif "level" in line:
        #     jason.write("\"level\": \"")
        #     linha = line.split("\"")
        #     linha = linha[-2]
        #     jason.write(linha)
        #     jason.write("\",\n")
        elif "node" in line:
            if (not nodeBool):
                nodeBool = True
                jason.seek(-2, os.SEEK_END)
                if (edgeBool):
                    edgeBool = False
                    jason.write("\n],\n")
                else:
                    jason.write("\n}\n],\n")
                jason.write("\"nodes\": [\n{\n")
            else:
                if (not weightBool):
                    jason.write("\"weight\": \"1\",\n")
                else:
                    weightBool = False
                jason.write("{\n")
        elif "id" in line:
            jason.write("\"id\": \"")
            linha = line.split(" ")
            linha = linha[-1]
            linha = linha[:-1]
            jason.write(linha)
            jason.write("\",\n")
        elif "weight" in line:
            weightBool = True
            jason.write("\"weight\": \"")
            linha = line.split(" ")
            linha = linha[-1]
            linha = linha[:-1]
            jason.write(linha)
            jason.write("\",\n")
        elif "edge" in line:
            if (not edgeBool):
                edgeBool = True
                jason.seek(-2, os.SEEK_END)
                jason.write("\n],\n")
                jason.write("\"links\": [\n{\n")
            else:
                jason.write("{\n")
        elif "source" in line:
            jason.write("\"source\": \"")
            linha = line.split(" ")
            linha = linha[-1]
            linha = linha[:-1]
            jason.write(linha)
            jason.write("\",\n")
        elif "target" in line:
            jason.write("\"target\": \"")
            linha = line.split(" ")
            linha = linha[-1]
            linha = linha[:-1]
            jason.write(linha)
            jason.write("\",\n")
        elif "]" in line:
            if (not twice):
                twice = True
                two = True
                jason.seek(-2, os.SEEK_END)
                jason.write("\n},\n")
        if(not two and twice):
            twice = False

    jason.seek(-2, os.SEEK_END)
    jason.write("\n]\n}")

    jason.close()
    arquivo.close()
