/**
 * @constructor
 * @param {Object} graph Object containing .json graph file, with:
 *      - graphInfo: object containing information such as:
 *              1) if the graph is directed;
 *              2) which multilevel is;
 *              3) the number of layers;
 *              4) n integers, each containing the number of nodes in a layer.
 *      - nodes: array of Node type;
 *      - edges: array of Edge type;
 * @param {int} min The minimal value for feature scaling, applied to nodes and edges. Default is 0.
 * @param {int} max The maximum value for feature scaling, applied to nodes and edges. Default is 10.
 */
var Graph = function(graph, min, max)
{
   /** Assigning default values to min and max size of elements */
  //  min = ecmaStandard(min);
  //  max = ecmaStandard(max);
   try
   {
       this.graphInfo = graph.graphInfo[0];
       if(this.graphInfo.vlayer != undefined)
       {
           this.firstLayer = this.graphInfo.vlayer.split(" ");
           this.firstLayer = this.firstLayer[0];
           this.lastLayer = this.graphInfo.vlayer.split(" ");
           this.lastLayer = this.lastLayer[this.lastLayer.length-1];
       }
       else
       {
           this.firstLayer = this.lastLayer =  Math.floor(graph.nodes.length / 2);
       }
       this.graphInfo.min = ecmaStandard(min, 0);
       this.graphInfo.max = ecmaStandard(max, 10);
       this.theta = 0;
       /** Define geometry and material in graph class for optimization - one actor only (graph), with only one mesh */
       this.circleGeometry = new THREE.CircleGeometry(1, 32);
       this.meshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.FrontSide, depthFunc: THREE.AlwaysDepth });
       if(graph.nodes instanceof Array)
       {
           this.nodes = [];
           for(var i = 0; i < graph.nodes.length; i++)
           {
               this.nodes[i] = new Node(graph.nodes[i], min, max, this.circleGeometry, this.meshBasicMaterial);
           }
       }
       /** Define geometry and material in graph class for optimization - one actor only (graph), with only one mesh */
       this.geometry = new THREE.Geometry();
       if(graph.links instanceof Array)
       {
           this.edges = [];
           for(var i = 0; i < graph.links.length; i++)
           {
               this.edges[i] = new Edge(graph.links[i], 0, 100, this.lineBasicMaterial);
           }
       }
   }
   catch(err)
   {
       throw "Unexpected error ocurred at line " + err.lineNumber + ", in function Graph. " + err;
   }
}

/**
 * Get element by id.
 * @public
 * @param {int} id Element id.
 * @returns {Object} Either Node or Edge type object.
 */
Graph.prototype.getElementById = function(id)
{
   var identification = id.slice(0,1);
   if(identification == "e") /* edge */
   {
       return this.getEdgeById(id);
   }
   else /* node */
   {
       return this.getNodeById(id);
   }
}

/**
 * Get nodes from graph.
 * @public
 * @returns {Array} Node type array.
 */
Graph.prototype.getNodes = function()
{
   return this.nodes;
}

/**
 * Get specific node from graph by id.
 * @public
 * @param {int} id Node id.
 * @returns {Object} Node type object.
 */
Graph.prototype.getNodeById = function(id)
{
   return this.getNodeByIndex(this.findNode(id));
}

/**
 * Find node by id.
 * @public
 * @param {int} id Node id.
 * @returns index of node, or -1 if node wasn't found.
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
 * Get specific node from graph by index.
 * @public
 * @param {int} i Index from array of nodes in "Graph" class.
 * @returns {Object} Either Node found, or string "Node not found.".
 */
Graph.prototype.getNodeByIndex = function(i)
{
   return i != -1 ? this.nodes[i] : "Node not found.";
}

/**
 * Get number of nodes from graph.
 * @public
 * @returns Length of nodes.
 */
Graph.prototype.getNumberOfNodes = function()
{
   return this.nodes.length;
}

/**
 * Set node by id.
 * @public
 * @param {int} id Node id.
 * @param {Object} node Object to be assigned.
 */
Graph.prototype.setNodeById = function(id, node)
{
   var index = this.findNode(id);
   this.nodes[index].setNode(node);
}

/**
 * Get specific edge from graph by id.
 * @public
 * @param {int} id Edge id.
 * @returns {Object} Edge type object.
 */
Graph.prototype.getEdgeById = function(id)
{
   return this.getEdgeByIndex(this.findEdge(id));
}

/**
 * Find edge by id.
 * @public
 * @param {int} id Edge id.
 * @returns index of edge, or -1 if edge wasn't found.
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
 * Get specific edge from graph by index.
 * @public
 * @param {int} i Index from array of edges in "Graph" class.
 * @returns {Object} Either Edge found, or string "Node not found.".
 */
Graph.prototype.getEdgeByIndex = function(i)
{
   return i != -1 ? this.edges[i] : "Edge not found.";
}

/**
 * Get number of edges from graph.
 * @public
 * @returns Length of edges.
 */
Graph.prototype.getNumberOfEdges = function()
{
   return this.edges.length;
}

/**
 * Set edge by id.
 * @public
 * @param {int} id Edge id.
 * @param {Object} node Object to be assigned.
 */
Graph.prototype.setEdgeById = function(id, edge)
{
   var index = this.findEdge(id);
   this.edges[index].setEdge(edge);
}

// /**
// * Highlight edges from highlighted graph
// * param:
// *    - highlightedElements: a list of names, containing highlighted elements at a specific mouse position.
// */
// Graph.prototype.highlightEdges = function(highlightedElements)
// {
//   for(var i = 0; i < highlightedElements.length; i++)
//   {
//       if(highlightedElements[i] instanceof Node)
//       {
//
//       }
//       else if(highlightedElements[i] instanceof Edge)
//       {
//
//       }
//   }
// }

/**
* Find node's neighbors.
* @public
* @param {Object} node Node from which neighbors will be found.
* @returns List of neighbors for given node.
*/
Graph.prototype.findNeighbors = function(node)
{
  var neighbors = [];
  var neighbor = undefined;
  for(var i = 0; i < this.edges.length; i++)
  {
    if(parseInt(this.edges[i].edgeObject.source) == parseInt(node.circle.name))
      neighbor = 1, neighbors.push(this.getNodeById(parseInt(this.edges[i].edgeObject.target)));
    else if(parseInt(this.edges[i].edgeObject.target) == parseInt(node.circle.name))
      neighbor = 1, neighbors.push(this.getNodeById(parseInt(this.edges[i].edgeObject.source)));
    if(neighbor !== undefined)
      neighbors.push(this.edges[i]);
    neighbor = undefined;
  }
  return neighbors;
}

/**
 * Builds graph in the scene. All necessary node and edge calculations are performed, then these elements are added as actors
 * @public
 * @param {Object} scene The scene in which the graph will be built.
 * @param {int} layout Graph layout.
 */
Graph.prototype.buildGraph = function(scene, layout)
{

  layout = ecmaStandard(layout, 2);
  scene = ecmaStandard(scene, undefined);
  this.theta = 3;
  try
  {
    var scale;
    /* From D3, use a scaling function for radial placement */
    scale = d3.scaleLinear().domain([0, (this.getNumberOfNodes())]).range([0, 2 * Math.PI]);

    /* Build nodes' meshes */
    var j = 0;
    for(var i = 0; i < this.nodes.length; i++)
    {
      if(i == this.firstLayer)
      {
        this.theta = ((this.firstLayer / this.lastLayer)  * this.theta);
        j = parseInt(j) + parseInt(1);
      }
      else if(i > this.firstLayer)
      {
        j = parseInt(j) + parseInt(1);
      }
      //  if(i == 0) this.setMinNode(parseInt(i*this.theta));
      //  if(i == this.nodes.length - 1) this.setMaxNode(parseInt(i*this.theta));
      this.nodes[i].buildNode(i, this.firstLayer, j, 20, this.theta, layout);
      if(scene !== undefined) scene.add(this.nodes[i].getCircle());
    }
    for(var i = 0; i < this.edges.length; i++)
    {
      this.edges[i].buildEdge(this.geometry, this.getNodeById(this.edges[i].edgeObject.source), this.getNodeById(this.edges[i].edgeObject.target));
    }
    if(scene !== undefined)
    {
      // var lineSegment = new THREE.LineSegments(this.geometry, this.lineBasicMaterial, THREE.LinePieces);
      // scene.add(lineSegment);
      var line = new MeshLine();
      line.setGeometry(this.geometry);
      line.setGeometry(this.geometry, function(p){
        return 0.3;
      });
      var material = new MeshLineMaterial({color: new THREE.Color(0x8D9091)});
      var lineMesh = new THREE.Mesh(line.geometry, material);
      scene.add(lineMesh);
    }
  }
  catch(err)
  {
     throw "Unexpected error ocurred at line " + err.line + ". " + err;
  }
}
