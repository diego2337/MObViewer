/**
 * Base class for a graph.
 * Author: Diego S. Cintra
 */

/**
 * Constructor
 * params: 
 *    - graphInfo: object containing information such as:
 *          1) if the graph is directed;
 *          2) which multilevel is;
 *          3) the number of layers;
 *          4) n integers, each containing the number of nodes in a layer.
 *    - nodes: array of Node type;
 *    - edges: array of Edge type.
 */
function Graph(graphInfo = undefined, nodes = undefined, edges = undefined)
{
    this.graphInfo = graphInfo[0];
    if(nodes instanceof Array)
    {
        this.nodes = [];
        nodes.forEach(function(d, i){
            this.nodes[i] = new Node(d);
        });
    }
    this.nodes = nodes;
    this.edges = edges;
}

/**
 * Get nodes from graph
 */
Graph.prototype.getNodes = function()
{
    return this.nodes;
}

/**
 * Get number of nodes from graph
 */
Graph.prototype.getNumberOfNodes = function()
{
    return this.nodes.length;
}

/**
 * Get edges from graph
 */
Graph.prototype.getEdges = function()
{
    return this.edges;
}

/**
 * Get number of edges from graph
 */
Graph.prototype.getNumberOfEdges = function()
{
    return this.edges.length;
}