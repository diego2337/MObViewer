#!/bin/bash
# Install dependencies for 'MObViewer' project.
# Author: Diego Cintra
# Date: 27 May 2019

sudo apt-get update
sudo apt-get upgrade
sudo apt install gcc python3-dev python3-pip libxml2-dev libxslt1-dev zlib1g-dev g++
sudo apt-get install python-setuptools
sudo apt-get install python-pypdf2
sudo apt-get install python-pip
sudo apt-get install -y libigraph0-dev
sudo apt-get install python-all-dev
sudo apt-get install npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
nvm install node
sudo npm install grunt --g
sudo pip install python-igraph
sudo pip3 install python-igraph
sudo pip3 install scipy
sudo apt-get install python-sklearn
sudo apt-get install pip
pip3 install pyyaml
sudo pip3-install pyyaml
sudo apt-get install libjpeg-dev
sudo apt-get install libpng-dev
sudo apt-get install zlib1g-dev libpng-dev libtiff5-dev
pip install imread
pip3 install imread
sudo pip3 install Pillow
sudo pip install Pillow
sudo pip3 install networkx
sudo pip install networkx
sudo apt-get install python3-setuptools
sudo pip install sharedmem
sudo pip3 install sharedmem