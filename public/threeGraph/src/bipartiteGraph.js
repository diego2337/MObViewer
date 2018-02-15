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
var BipartiteGraph = function(graph, min, max)
{
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
   }
   catch(err)
   {
       throw "Unexpected error ocurred at line " + err.lineNumber + ", in function BipartiteGraph. " + err;
   }
}

/**
 * Get nodes from graph.
 * @public
 * @returns {Array} Node type array.
 */
BipartiteGraph.prototype.getNodes = function()
{
   return this.nodes;
}

/**
 * Get specific node from graph by index.
 * @public
 * @param {int} i Index from array of nodes in "BipartiteGraph" class.
 * @returns {Object} Either Node found, or string "Node not found.".
 */
BipartiteGraph.prototype.getNodeByIndex = function(i)
{
   return i != -1 ? this.nodes[i] : "Node not found.";
}

/**
 * Get number of nodes from entire bipartite graph.
 * @public
 * @returns Length of nodes.
 */
BipartiteGraph.prototype.getTotalNumberOfNodes = function()
{
   return this.nodes.length;
}

/**
 * Get number of nodes from first layer of bipartite graph.
 * @public
 * @returns Number of nodes from first layer.
 */
BipartiteGraph.prototype.getNumberOfNodesFromFirstLayer = function()
{
   return this.firstLayer.length;
}

/**
 * Get number of nodes from second layer of bipartite graph.
 * @public
 * @returns Number of nodes from second layer.
 */
BipartiteGraph.prototype.getNumberOfNodesFromSecondLayer = function()
{
   return this.lastLayer.length;
}

/**
 * Get specific edge from graph by index.
 * @public
 * @param {int} i Index from array of edges in "BipartiteGraph" class.
 * @returns {Object} Either Edge found, or string "Node not found.".
 */
BipartiteGraph.prototype.getEdgeByIndex = function(i)
{
   return i != -1 ? this.edges[i] : "Edge not found.";
}

/**
 * Get number of edges from graph.
 * @public
 * @returns Length of edges.
 */
BipartiteGraph.prototype.getNumberOfEdges = function()
{
   return this.edges.length;
}

/**
 * Find node's neighbors.
 * @public
 * @param {Object} node Node from which neighbors will be found.
 * @returns List of neighbors for given node.
 */
BipartiteGraph.prototype.findNeighbors = function(node)
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
 * @param {Object} graph Object containing .json graph file.
 * @param {Object} scene The scene in which the graph will be built.
 * @param {int} layout Graph layout.
 */
BipartiteGraph.prototype.buildGraph = function(graph, scene, layout)
{
  layout = ecmaStandard(layout, 2);
  scene = ecmaStandard(scene, undefined);
  this.theta = 3;
  try
  {
    /** y represents space between two layers, while theta space between each vertice of each layer */
    var y = -20, theta = 3;
    /** Build nodes' meshes */
    var meshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.FrontSide, depthFunc: THREE.AlwaysDepth });
    // var circleGeometry = new THREE.CircleGeometry(1, 32);
    for(var i = 0, pos = (-1 * (this.firstLayer / 2.0)); i < graph.nodes.length; i++, pos++)
    {
      if(i == this.firstLayer)
      {
        pos = -1 * Math.floor(this.lastLayer / 2);
        y = y * (-1);
      }
      /** Using feature scale for node sizes */
      if(graph.nodes[i].weight == undefined) graph.nodes[i].weight = 1;
      var circleSize = (graph.nodes[i].weight - graph.graphInfo[0].minNodeWeight)/(graph.graphInfo[0].maxNodeWeight-graph.graphInfo[0].minNodeWeight);
      /** Creating geometry and material for meshes */
      var circleGeometry = new THREE.CircleGeometry(circleSize, 32);
      /** Give mesh name the same as its id */
      var circleMesh = new THREE.Mesh(circleGeometry, meshBasicMaterial);
      circleMesh.name = graph.nodes[i].id;
      circleMesh.renderOrder = 1;
      /** Build node */
      var x = pos * theta;
      circleMesh.position.set(x, y, 0);
      scene.add(circleMesh);
    }

    /** Creating geometry for edges */
    var geometry = new THREE.Geometry();
    /** Build edges mesh */
    for(var i = 0; i < graph.links.length; i++)
    {
      var sourcePos = scene.getObjectByName(graph.links[i].source, true);
      var targetPos = scene.getObjectByName(graph.links[i].target, true);
      // var sourcePos = {position: {x:Math.random(), y:Math.random(), z:0}};
      // var targetPos = {position:{x:Math.random(), y:Math.random(), z:0}};
      var v1 = new THREE.Vector3(sourcePos.position.x, sourcePos.position.y, sourcePos.position.z);
      var v2 = new THREE.Vector3(targetPos.position.x, targetPos.position.y, targetPos.position.z);
      geometry.vertices.push(v1);
      geometry.vertices.push(v2);
    }

    /** Build edges */
    // var lineSegment = new THREE.LineSegments(this.geometry, this.lineBasicMaterial, THREE.LinePieces);
    // scene.add(lineSegment);
    var line = new THREE.MeshLine();
    line.setGeometry(geometry);
    line.setGeometry(geometry, function(p){
      return 0.3;
    });
    var material = new MeshLineMaterial({color: new THREE.Color(0x8D9091)});
    var lineMesh = new THREE.Mesh(line.geometry, material);
    scene.add(lineMesh);
    geometry.dispose();
    material.dispose();
  }
  catch(err)
  {
     throw "Unexpected error ocurred at line " + err.line + ". " + err;
  }
}
