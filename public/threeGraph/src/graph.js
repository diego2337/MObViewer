/**
 * Base class for a graph.
 * Author: Diego S. Cintra
 */

var d3 = require('d3');
var Node = require('./node.js');
var Edge = require('./edge.js');
var THREE = require('../../../node_modules/three/build/three.js');
var ecmaStandard = require('../utils/ecmaStandard.js');

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
 *    - min: the minimal value for feature scaling, applied to nodes and edges. Default is 0
 *    - max: the maximum value for feature scaling, applied to nodes and edges. Default is 10
 */
var Graph = function(graph, layout, min, max)
{
    /* Pre ECMAScript2015 standardization */
    // layout = typeof layout !== 'undefined' ? layout : 2;
    // min = typeof min !== 'undefined' ? min : 0;
    // max = typeof max !== 'undefined' ? max : 10;
    layout = ecmaStandard(layout);
    min = ecmaStandard(min);
    max = ecmaStandard(max);
    try
    {
        this.layout = layout;
        this.graphInfo = graph.graphInfo[0];
        this.graphInfo.min = min;
        this.graphInfo.max = max;
        if(graph.nodes instanceof Array)
        {
            this.nodes = [];
            for(var i = 0; i < graph.nodes.length; i++)
            {
                this.nodes[i] = new Node(graph.nodes[i], min, max);
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
        throw "Unexpected error ocurred at line " + err.lineNumber + ", in function Graph. " + err;
    }
}

/**
 * Get element by id
 * param:
 *    - id: element id.
 */
Graph.prototype.getElementById = function(id)
{
    var identification = id.slice(0,1);
    if(identification == "e") // edge
    {
        return this.getEdgeById(id);
    }
    else // node
    {
        return this.getNodeById(id);
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
 * Get nodes meshes
 */
Graph.prototype.getNodesMeshes = function()
{
    var meshes = [];
    for(var i = 0; i < this.nodes.length; i++)
    {
        meshes.push(this.nodes[i].getCircle());
    }
    return meshes;
}

/**
 * Get specific node from graph by id
 * param:
 *    - id: node id.
 */
Graph.prototype.getNodeById = function(id)
{
    return this.getNodeByIndex(this.findNode(id));
}

/**
 * Find node by id
 * param:
 *    - id: node id.
 */
Graph.prototype.findNode = function(id)
{
    for(var i = 0; i < this.nodes.length; i++)
    {
        if(this.nodes[i].nodeObject.id == id)
        {
            return i;
        }
    }
    return -1;
}

/**
 * Get specific node from graph by index
 * param:
 *    - i: index from array of nodes in "Graph" class.
 */
Graph.prototype.getNodeByIndex = function(i)
{
    return i != -1 ? this.nodes[i] : "Node not found.";
}

/**
 * Get number of nodes from graph
 */
Graph.prototype.getNumberOfNodes = function()
{
    return this.nodes.length;
}

/**
 * Set node by id
 * param:
 *    - id: node id;
 *    - node: object to be assigned.
 */
Graph.prototype.setNodeById = function(id, node)
{
    var index = this.findNode(id);
    this.nodes[index].setNode(node);
}

/**
 * Get edges from graph
 */
Graph.prototype.getEdges = function()
{
    return this.edges;
}

/**
 * Get edges meshes
 */
Graph.prototype.getEdgesMeshes = function()
{
    var meshes = [];
    for(var i = 0; i < this.edges.length; i++)
    {
        meshes.push(this.edges[i].getLine());
    }
    return meshes;
}

/**
 * Get specific edge from graph by id
 * params:
 *    - id: edge id.
 */
Graph.prototype.getEdgeById = function(id)
{
    return this.getEdgeByIndex(this.findEdge(id));
}

/**
 * Find edge by id
 * param:
 *    - id: edge id.
 */
Graph.prototype.findEdge = function(id)
{
    for(var i = 0; i < this.edges.length; i++)
    {
        if(this.edges[i].edgeObject.id == id)
        {
            return i;
        }
    }
    return -1;
}

/**
 * Get specific edge from graph by index
 * param:
 *    - i: index from array of edges in "Graph" class.
 */
Graph.prototype.getEdgeByIndex = function(i)
{
    return i != -1 ? this.edges[i] : "Edge not found.";
}

/**
 * Get specific edge from graph by index
 * param:
 *    - i: index from array of edges in "Graph" class.
 */
Graph.prototype.getEdgeByIndex = function(i)
{
    return this.edges[i];
}

/**
 * Get number of edges from graph
 */
Graph.prototype.getNumberOfEdges = function()
{
    return this.edges.length;
}

/**
 * Set edge by id
 * param:
 *    - id: edge id;
 *    - edge: object to be assigned.
 */
Graph.prototype.setEdgeById = function(id, edge)
{
    var index = this.findEdge(id);
    this.edges[index].setEdge(edge);
}

/**
 * Builds the graph in the scene. All the node and edge calculations are performed, and the elements added
 * params:
 *    - scene: the scene in which the graph will be built;
 *    - layout: graph layout. Default is 2 = radial.
 */
Graph.prototype.buildGraph = function(scene, layout)
{
    layout = ecmaStandard(layout, 2);
    scene = ecmaStandard(scene, undefined);
    try
    {
        var scale, theta;
        /* From D3, use a scaling function for placement */
        scale = d3.scaleLinear().domain([0, this.getNumberOfNodes()]).range([0, 2 * Math.PI]);

        /* Build nodes' meshes */
        for(var i = 0; i < this.nodes.length; i++)
        {
            theta = scale(i);
            this.nodes[i].buildNode(theta, layout);
            if(scene !== undefined) scene.add(this.nodes[i].getCircle());
        }

        /* Build edges' meshes and add to scene */
        for(var i = 0; i < this.edges.length; i++)
        {
            this.edges[i].buildEdge(this.getNodeById(this.edges[i].edgeObject.source), this.getNodeById(this.edges[i].edgeObject.target)); //this.graphInfo.min, this.graphInfo.max
            // var helper = new THREE.FaceNormalsHelper(this.edges[i].getLine());
            // scene.add(helper);
            if(scene !== undefined) scene.add(this.edges[i].getLine());
        }
    }
    catch(err)
    {

        throw "Unexpected error ocurred at line " + err.line + ". " + err;
    }
}

module.exports = Graph;
