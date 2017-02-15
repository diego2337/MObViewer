/**
 * Base class for a graph.
 * Author: Diego S. Cintra
 */

/**
 * Constructor
 * params: 
 *    - graphInfo: array of strings;
 *    - nodes: array of Node type;
 *    - edges: array of Edge type.
 */
function Graph(graphInfo = undefined, nodes = undefined, edges = undefined)
{
    this.graphInfo = graphInfo;
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