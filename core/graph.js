/**
 * Base class for a graph.
 * Author: Diego S. Cintra
 */

/**
 * Constructor
 * params: 
 *    - graph: object containing JSON graph file, with:
 *      - graphInfo: object containing information such as:
 *              1) if the graph is directed;
 *              2) which multilevel is;
 *              3) the number of layers;
 *              4) n integers, each containing the number of nodes in a layer.
 *      - nodes: array of Node type;
 *      - edges: array of Edge type.
 *    - layout: enum containing layout of graph. Can be:
 *      - 1) Force-directed;
 *      - 2) Radial;
 *      - 3) Bipartite.
 */
function Graph(graph, layout = 2)
{
    try
    {
        this.layout = layout;
        this.graphInfo = graph.graphInfo[0];
        if(graph.nodes instanceof Array)
        {
            this.nodes = [];
            for(var i = 0; i < graph.nodes.length; i++)
            {
                this.nodes[i] = new Node(graph.nodes[i]);
            }
            // graph.nodes.forEach(function(d, i){
            //     this.nodes[i] = new Node(d);
            // });
        }
        if(graph.links instanceof Array)
        {
            this.edges = [];
            for(var i = 0; i < graph.links.length; i++)
            {
                this.edges[i] = new Edge(graph.links[i]);
            }
            // graph.edges.forEach(function(d, i){
            //     this.edges[i] = new Edge(d);
            // })
        }
    }
    catch(err)
    {
        throw "Unexpected error ocurred at line " + err.lineNumber + ". " + err;
    }
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

/**
 * Builds the graph in the scene. All the node and edge calculations are performed, and the elements added
 */
Graph.prototype.buildGraph = function(scene, layout = 2)
{
    try
    {
        var scale, theta;
        /* Build the nodes' meshes */
        for(var i = 0; i < this.nodes.length; i++)
        {
            /* From D3, use a scaling function for placement */
            scale = d3.scale.linear().domain([0, this.nodes.length]).range([0, 2 * Math.PI]);
            theta = scale(i);
            this.nodes[i].buildNode(theta, layout);
            console.log(this.nodes[i].getCircle().position);
            scene.add(this.nodes[i].getCircle());
        }

        /* Build the edges' meshes */
        for(var i = 0; i < this.edges.length; i++)
        {
            //scene.add(this.edges[i].buildEdge(layout, i));
        }
    }
    catch(err)
    {
        throw "Unexpected error ocurred at line " + err.line + ". " + err;
    }
}