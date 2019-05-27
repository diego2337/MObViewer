#!/bin/bash
# Install dependencies for 'MObViewer' project.
# Author: Diego Cintra
# Date: 27 May 2019

sudo apt-get install python-setuptools
sudo apt-get install python-pypdf2
sudo apt-get install python-pip
sudo apt-get install -y libigraph0-dev
sudo apt-get install python-all-dev
sudo apt-get install npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
nvm install node
sudo npm install grunt --g
sudo pip3 install python-igraph
sudo pip3 install scipy
sudo apt-get install python-sklearn
sudo apt-get install pip
sudo pip3-install pyyaml
sudo pip3 install Pillow
sudo pip3 install networkx
sudo pip3 install sharedmem