## MOb (Multilevel framework to bipartite network)

**About**

This is an Python implementation of multilevel framework for handling bipartite networks, published by Alan et. al. [1]. The implementation is based on multilevel approach for combinatorial optimization that can perform in bipartite context. The aim to reduce the cost of an optimization process by applying it to a reduced or coarsened version of the original bipartite network.

**Usage**

    $ python coarsening.py [-f] [-d] [-o] [-v] [-r] [-m] [-c] [-s] [-e]

| Option					| Domain					| Description															|
|:------------------------- |:------------------------- |:--------------------------------------------------------------------- |
| -f, --filename			| string [FILE]				| Dataset as input file													|
| -d, --directory			| string [DIR]				| Output directory														|
| -o, --output				| string [FILE]				| Output file (default .ncol)											|
| -v, --vertices			| int						| Number of vertices for each layer										|
| -r, --rf					| (0, 0.5]					| Reduction factor for each layer (default: 0.5)						|
| -m, --ml					| [0, n]					| Max levels (default: 1)		 										|
| -c, --matching			| string 					| Matching method (default: Greed Rand Twohopes)						|
| -s, --similarity			| string					| Similarity measure (default: Common Neighbors)						|
| -l, --layers				| {1,2}						| Layers that will be processed  (default: None)						|
| -e, --extension			| string [ncol, gml, pajek]	| Output extension (default: ncol)										|

The matching strategy selects the best pairs of vertices for matching. Formally, a matching $M$ can be denoted by a set of pairwise non-adjacent edges, i.e., a set of edges with no common vertices. In this software it is possible use two matching methods:

> * Greed Rand Twohopes
> * Greed Twohopes

The matching strategy is, therefore, a key component of an effective multilevel optimization, as it leads to a good hierarchy of coarsened networks for supporting the local search algorithm. A poor choice of the matching impairs the multilevel process, hence, the performance of the local search algorithm. In this software it is possible use some similarity measures:

> * Common Neighbors
> * Weighted Common Neighbors
> * Preferential Attachment
> * Jaccard
> * Salton
> * Adamic Adar
> * Resource Allocation
> * Sorensen
> * Hub Promoted
> * Hub Depressed
> * Leicht Holme Newman

**Quick benchmark results**

We test a scientific collaboration network (Cond-Mat), available [here](https://toreopsahl.com/datasets/#newman2001), which is based on preprints posted in the Condensed Matter section (arXiv) between 1995 and 1999 and has 38.742 vertices (authors and papers) and 58.595 edges (authorship) among different types of vertices.

    $ time python coarsening.py -f input/condmat9599R16726C22016.ncol -v 16726 22016 -l 0 1 -m 1 1 -r 0.5 0.5 -c Greed Rand Twohopes -s Weighted Common Neighbors

    real  0m1.454s
    user  0m1.672s
    sys   0m0.372s

	$ time python coarsening.py -f input/condmat9599R16726C22016.ncol -v 16726 22016 -l 0 1 -m 2 2 -r 0.5 0.5 -c Greed Rand Twohopes -s Weighted Common Neighbors

    real  0m1.773s
    user  0m2.116s
    sys   0m0.360s

	$ time python coarsening.py -f input/condmat9599R16726C22016.ncol -v 16726 22016 -l 0 1 -m 3 3 -r 0.5 0.5 -c Greed Rand Twohopes -s Weighted Common Neighbors

    real  0m1.976s
    user  0m2.364s
    sys   0m0.468s

	$ time python coarsening.py -f input/condmat9599R16726C22016.ncol -v 16726 22016 -l 0 1 -m 4 4 -r 0.5 0.5 -c Greed Rand Twohopes -s Weighted Common Neighbors

    real  0m2.145s
    user  0m2.588s
    sys   0m0.404s

[comment]: <> (https://bitbucket.org/alanvalejo/mob/raw/master/images/m0dd.png)
original cc distribution | cc distribution with 1 level of coarsening
:--------------------:|:-------------------------:
![](images/m0cc.png)  |  ![](images/m1cc.png)

Original degree distribution | degree distribution with 1 level of coarsening
:--------------------:|:-------------------------:
![](images/m0dd.png)  |  ![](images/m1dd.png)

**References**
> [1] Valejo, A.; Ferreira V.; Rocha Filho, G. P.; Oliveira, M. C. F.; and Lopes, A. A.: A Multilevel approach for combinatorial optimization in bipartite networks. (2017)

~~~~~{.bib}
@article{Alan_2014,
    author={Valejo, A.; Ferreira V.; Rocha Filho, G. P.; Oliveira, M. C. F.; and Lopes, A. A.},
    title={Multilevel approach for combinatorial optimization in bipartite networks},
    journal={Knowledge-Based Systems},
    year={2017},
}
~~~~~

<div class="footer"> &copy; Copyright (C) 2017 Alan Valejo &lt;alanvalejo@gmail.com&gt; All rights reserved.</div>
