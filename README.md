# MObViewer

MObViewer is a visualization tool that introduces a novel metaphor to visualize bipartite graphs, obtained from the execution of the multilevel paradigm framework [MOb](http://www.alanvalejo.com.br/software?name=mob). The multilevel paradigm yields an hierarchy of coarsened graphs as output. MObViewer uses this hierarchy as input, where vertices are depicted as circles of varying sizes (circle size maps the number of elements in a super-vertex). The two innermost rows of circles depict the two vertice layers of the coarsest graph, while moving outwards the outer rows represent the layers in the hierarchy of intermediate graphs. The outermost rows, rendered in gray, depict the layers of the input graph. In a bipartite graph G = (V<sub>1</sub>, V<sub>2</sub>), layers V<sub>1</sub> and V<sub>2</sub>are displayed, respectively, at the bottom and at the top areas. Once a vertex is selected its adjacent edges are rendered, otherwise edges are not rendered. Additionally, MObViewer uses different visualization techniques to support visual exploration of bipartite graphs in real world datasets. The image below shows the novel visualization.

![Image of novel metaphor](/img/visualMetaphorInteractionNEW.png)

# Getting Started

## For UNIX users

Run `dependencies.sh` to install all the required packages. Alternatively, if you wish to do it manually, the following packages are required:

* [npm](https://www.npmjs.com)
* [node.js > v6.0.0](https://nodejs.org/en/)
* [grunt](https://gruntjs.com/)
* [pip](https://pypi.org/project/pip/)
* [scipy](https://www.scipy.org/)
* [sklearn](https://scikit-learn.org/stable/)
* [python-setupTools](https://pypi.org/project/setuptools/)
* [python-pyPDF2](https://pypi.org/project/PyPDF2/)
* [libigraph](https://packages.debian.org/jessie/libigraph0-dev)
* [python-igraph](https://igraph.org/python/)
* [PyYAML](https://pyyaml.org/)
* [pillow](https://pillow.readthedocs.io/en/stable/)
* [networkx](https://networkx.github.io/)
* [sharedmem](https://github.com/rainwoodman/sharedmem)

After downloading files, simply run `npm install` to install additional dependencies handled by Grunt. Then fire `grunt` command to start the server at port `3030`. The URL to use MObViewer is usually https://localhost:3030.

## For Windows users

Support for Windows is currently unavailable, see [this issue](https://github.com/diego2337/MObViewer/issues/1).

# Usage

## Loading a bipartite graph
Initially, load a bipartite graph with the `Load Graph...` button at the top right, which takes files with extension `.json` or `.gml`. A simple bipartite graph in `.json` notation would be:

    {
        "graphInfo": [
            {
                "directed": "0", 
                "vertices": "2 2"
            }
        ], 
        "nodes": [
            {
                "attr": "0", 
                "id": "0"
            },
            {
                "attr": "0", 
                "id": "1"
            },
            {
                "attr": "0", 
                "id": "2"
            },
            {
                "attr": "0", 
                "id": "3"
            }
        ], 
        "links": [
            {
                "source": "0", 
                "target": "2", 
                "weight": "1"
            },
            {
                "source": "0", 
                "target": "3", 
                "weight": "2"
            },
            {
                "source": "1", 
                "target": "3", 
                "weight": "1"
            }
        ]
    }
    
 Where `"attr"` can be any attribute associated with a vertice. `"id"` is required for MObViewer to work properly. Edges can have no `weight` associated.
 
 ## Running the multilevel paradigm
 
 After loading the bipartite graph, users can define the multilevel paradigm coarsening parameters by using the `Define JSON Input` button, which uses `JSON` notation. A typical example would be:
 
    {
     "vertices":
     [
       "3919",
       "2378"
     ],
     "matching":
     [
       "gmb"
     ],
     "reduction_factor":
     [
       "0.5",
       "0.5"
     ],
     "max_levels":
     [
       "3",
       "3"
     ],
     "similarity":
     [
       "weighted_common_neighbors"
     ],
     "filename": "ieeeVis.json",
     "save_conf": false,
     "save_ncol": false,
     "save_gml": true,
     "save_source": false,
     "save_predecessor": false,
     "show_timing": false,
     "save_timing": false,
     "save_hierarchy": true,
     "unique_key": false
    }

Where `vertices` stores the total number of vertices for layers V<sub>1</sub> and V<sub>2</sub>, respectively. `matching` allows to choose between either `gmb` or `mlp` algorithms. `filename` points to the bipartite graph file name.

## Additional visualizations

With user interaction, additional visualization techniques can be employed to support visual exploration of real world datasets.

### Word Cloud

Button `Define Word Cloud Attribute` takes as input a vertice's attribute. The word cloud will compute this attribute for **neighbors** of a selected vertice, calculating their frequencies and mapping them to font sizes. The figure below shows an example.

![Image of word cloud](/img/wordCloudVisualization.png)

### Frequency Histogram

Button `Define data categories` takes as input a vertice's attributes, organized into either "categorical" (non-numerical values) or "ordinal". A typical example would be

    attribute1,categorical
    attribute2,ordinal,1990-2015

### Pie chart

Button `Define Label` takes as input a vertice's attribute, defining a color scheme for each value the attribute can assume. By merging vertices, they create pie charts, showing the most frequent value for the given vertice.

# Interface

The figure below shows an overall view of MObViewer. (A) shows the header panel and its buttons. (B) shows the word cloud and frequency histogram visualizations. (C) shows vertice info for the selected super-vertice and its neighbors. (D) shows graph info of the hierarchy of coarsened vertices and interaction functions ("reset to center", "zoom in", "zoom out"). (E) shows the color scheme and edge weights. (F) shows the resulting visualization.

![Image of MObViewer](/img/mobOverviewNEW.png)
