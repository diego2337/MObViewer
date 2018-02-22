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
       else if(this.graphInfo.vertices != undefined)
       {
           this.firstLayer = this.graphInfo.vertices.split(" ");
           this.firstLayer = this.firstLayer[0];
           this.lastLayer = this.graphInfo.vertices.split(" ");
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
    var y = -25, theta = 5;
    /** Array to store (x,y,z) coordinates of nodes */
    var positions = [];
    /** Build nodes */
    /** Creating geometry and material for nodes */
    var material = new THREE.MeshLambertMaterial( {  wireframe: false, vertexColors:  THREE.FaceColors } );
    var circleGeometry = new THREE.CircleGeometry(1, 32);
    /** Color vertexes */
    for(var k = 0; k < circleGeometry.faces.length; k++)
    {
      circleGeometry.faces[k].color.setRGB(0.0, 0.0, 0.0);
    }
    /** Create single geometry which will contain all geometries */
    var singleGeometry = new THREE.Geometry();
    // singleGeometry.name = "MainGeometry";
    for(var i = 0, pos = (-1 * (this.firstLayer / 2.0)); i < graph.nodes.length; i++, pos++)
    {
      if(i == this.firstLayer)
      {
        pos = -1 * Math.floor(this.lastLayer / 2);
        y = y * (-1);
      }
      var x = pos * theta;
      if(graph.nodes[i].weight == undefined) graph.nodes[i].weight = parseInt(graph.graphInfo[0].minNodeWeight);
      var circleSize = (5.0 - 1.0) * ( (parseInt(graph.nodes[i].weight) - parseInt(graph.graphInfo[0].minNodeWeight))/((parseInt(graph.graphInfo[0].maxNodeWeight)-parseInt(graph.graphInfo[0].minNodeWeight))+1) ) + 1.0;
      if(circleSize == 0) circleSize = parseInt(graph.graphInfo[0].minNodeWeight);
      // circleSize = circleSize * 5;
      /** Using feature scale for node sizes */
      circleGeometry.scale(circleSize, circleSize, 1);
      /** Give geometry name the same as its id */
      circleGeometry.name = graph.nodes[i].id;
      /** Translate geometry for its coordinates */
      circleGeometry.translate(x, y, 0);
      /** Push coordinates to array */
      positions.push({x: x, y: y, z: 0});
      /** Merge into singleGeometry */
      singleGeometry.merge(circleGeometry);
      /** Return geometry for reusing */
      circleGeometry.translate(-x, -y, 0);
      circleGeometry.name = "";
      circleGeometry.scale((1/circleSize), (1/circleSize), 1);
    }
    /** Create one mesh from single geometry and add it to scene */
    mesh = new THREE.Mesh(singleGeometry, material);
    mesh.name = "MainMesh";
    /** Alter render order so that node mesh will always be drawn on top of edges */
    mesh.renderOrder = 1;
    scene.add(mesh);

    mesh = null;

    singleGeometry.dispose();
    circleGeometry.dispose();
    material.dispose();

    singleGeometry = null;
    circleGeometry = null;
    material = null;

    /** Build edges */
    if(graph.links)
    {
      var edgeGeometry = new THREE.Geometry();
      for(var i = 0; i < graph.links.length; i++)
      {
        /** Normalize edge weight */
        if(graph.links[i].weight == undefined) graph.links[i].weight = parseInt(graph.graphInfo[0].minEdgeWeight);
        var edgeSize = (5.0 - 1.0) * ( (parseInt(graph.links[i].weight) - parseInt(graph.graphInfo[0].minEdgeWeight))/((parseInt(graph.graphInfo[0].maxEdgeWeight)-parseInt(graph.graphInfo[0].minEdgeWeight))+1) ) + 1.0;
        if(edgeSize == 0) edgeSize = parseInt(graph.graphInfo[0].minEdgeWeight);

        /** Calculate path */
        var sourcePos = positions[graph.links[i].source];
        var targetPos = positions[graph.links[i].target];
        var v1 = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
        var v2 = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
        edgeGeometry.vertices.push(v1);
        edgeGeometry.vertices.push(v2);
      }
      for(var i = 0; i < edgeGeometry.vertices.length; i = i + 2)
      {
        edgeGeometry.colors[i] = new THREE.Color(0x8D9091);
        edgeGeometry.colors[i+1] = edgeGeometry.colors[i];
      }
      edgeGeometry.colorsNeedUpdate = true;


      /** Create one LineSegments and add it to scene */
      var edgeMaterial = new THREE.LineBasicMaterial({vertexColors:  THREE.VertexColors});
      var lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial, THREE.LinePieces);
      scene.add(lineSegments);

      edgeGeometry.dispose();
      edgeGeometry = null;
      edgeMaterial.dispose();
      edgeMaterial = null;

      // var line = new THREE.MeshLine();
      // line.setGeometry(edgeGeometry);
      // line.setGeometry(edgeGeometry, function(p){
      //   return 0.3;
      // });
      // var edgeMaterial = new THREE.MeshLineMaterial({color: new THREE.Color(0x8D9091)});
      // var lineMesh = new THREE.Mesh(line.geometry, edgeMaterial);
      // scene.add(lineMesh);
      // edgeMaterial.dispose();
      // edgeGeometry.dispose();
      // edgeMaterial = null;
      // edgeGeometry = null;
      // line = null;
      // lineMesh = null;
    }

    // /** y represents space between two layers, while theta space between each vertice of each layer */
    // var y = -20, theta = 3;
    // /** Build nodes' meshes */
    // var meshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.FrontSide, depthFunc: THREE.AlwaysDepth });
    // // var circleGeometry = new THREE.CircleGeometry(1, 32);
    // for(var i = 0, pos = (-1 * (this.firstLayer / 2.0)); i < graph.nodes.length; i++, pos++)
    // {
    //   if(i == this.firstLayer)
    //   {
    //     pos = -1 * Math.floor(this.lastLayer / 2);
    //     y = y * (-1);
    //   }
    //   /** Using feature scale for node sizes */
    //   if(graph.nodes[i].weight == undefined) graph.nodes[i].weight = 1;
    //   var circleSize = (graph.nodes[i].weight - graph.graphInfo[0].minNodeWeight)/(graph.graphInfo[0].maxNodeWeight-graph.graphInfo[0].minNodeWeight);
    //   /** Creating geometry and material for meshes */
    //   var circleGeometry = new THREE.CircleGeometry(circleSize, 32);
    //   /** Give mesh name the same as its id */
    //   var circleMesh = new THREE.Mesh(circleGeometry, meshBasicMaterial);
    //   circleMesh.name = graph.nodes[i].id;
    //   circleMesh.renderOrder = 1;
    //   /** Build node */
    //   var x = pos * theta;
    //   circleMesh.position.set(x, y, 0);
    //   scene.add(circleMesh);
    // }

    // /** Creating geometry for edges */
    // var geometry = new THREE.Geometry();
    // /** Build edges mesh */
    // for(var i = 0; i < graph.links.length; i++)
    // {
    //   var sourcePos = scene.getObjectByName(graph.links[i].source, true);
    //   var targetPos = scene.getObjectByName(graph.links[i].target, true);
    //   // var sourcePos = {position: {x:Math.random(), y:Math.random(), z:0}};
    //   // var targetPos = {position:{x:Math.random(), y:Math.random(), z:0}};
    //   var v1 = new THREE.Vector3(sourcePos.position.x, sourcePos.position.y, sourcePos.position.z);
    //   var v2 = new THREE.Vector3(targetPos.position.x, targetPos.position.y, targetPos.position.z);
    //   geometry.vertices.push(v1);
    //   geometry.vertices.push(v2);
    // }
    //
    // /** Build edges */
    // // var lineSegment = new THREE.LineSegments(this.geometry, this.lineBasicMaterial, THREE.LinePieces);
    // // scene.add(lineSegment);
    // var line = new THREE.MeshLine();
    // line.setGeometry(geometry);
    // line.setGeometry(geometry, function(p){
    //   return 0.3;
    // });
    // var material = new MeshLineMaterial({color: new THREE.Color(0x8D9091)});
    // var lineMesh = new THREE.Mesh(line.geometry, material);
    // scene.add(lineMesh);
    // geometry.dispose();
    // material.dispose();
  }
  catch(err)
  {
     throw "Unexpected error ocurred at line " + err.line + ". " + err;
  }
}

/**
 * @constructor
 * @param {Object} edgeObject The edge object taken from the JSON file.
 * @param {int} min Min value to be used in feature scaling.
 * @param {int} max Max value to be used in feature scaling.
 * @param {Object} geometry Optimized geometry to build line (from three.js).
 * @param {Object} lineBasicMaterial Material for geometry (from three.js).
 */
var Edge = function(edgeObject, min, max, geometry, lineBasicMaterial)
{
    /* Pre ECMAScript 2015 standardization */
    min = ecmaStandard(min, 0);
    max = ecmaStandard(max, 100);
    try
    {
        this.edgeObject = edgeObject;
        /* Defining edge id by concatenation of source and target nodes' id */
        this.edgeObject.id = "e" + edgeObject.source.toString() + edgeObject.target.toString();
        if(this.edgeObject.weight == undefined)
        {
            this.edgeObject.weight = 1;
        }
        /* Use feature scaling to fit edges */
        this.edgeRadius = (this.edgeObject.weight - min)/(max-min);
        this.line = new MeshLine();
    }
    catch(err)
    {
        throw "Constructor must have edgeObject type as first parameter! ";
    }
}

/**
 * Getter for edge via copy, not reference.
 * @public
 * @returns {Object} Edge type object.
 */
Edge.prototype.getEdge = function()
{
    var edge = new Edge();
    edge.setGeometry(this.circleGeometry);
    edge.setLineBasicMaterial(this.lineBasicMaterial);
    edge.setLine(this.line);
    return edge;
}

/**
 * Sets the current edge with new node attributes.
 * @public
 * @param {Object} edge Edge for copying.
 */
Edge.prototype.setEdge = function(edge)
{
    this.setGeometry(edge.geometry);
    this.setlineBasicMaterial(edge.setlineBasicMaterial);
    this.setLine(edge.line);
}

/**
 * Build edge into scene.
 * @public
 * @param {Object} geometry Geometry for edges.
 * @param {Object} source Source node from which the edge starts.
 * @param {Object} target Target node from which the edge ends.
 */
Edge.prototype.buildEdge = function(geometry, source, target)
{
    var sourcePos = source.getCircle().position;
    var targetPos = target.getCircle().position;
    var v1 = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
    var v2 = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
    geometry.vertices.push(v1);
    geometry.vertices.push(v2);
}

/**
 * Highlight edge.
 * @public
 */
Edge.prototype.highlight = function()
{
    this.line.material.color.setHex(0xFF0000);
}

/**
 * Unhighlight edge.
 * @public
 */
Edge.prototype.unhighlight = function()
{
    this.line.material.color.setHex(0x8D9091);
}

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
      //  this.circleGeometry = new THREE.CircleGeometry(1, 32);
      //  this.meshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.FrontSide, depthFunc: THREE.AlwaysDepth });
       if(graph.nodes instanceof Array)
       {
           this.nodes = [];
           for(var i = 0; i < graph.nodes.length; i++)
           {
               this.nodes[i] = new Node(graph.nodes[i], this.minNodeWeight, this.maxNodeWeight, this.circleGeometry, this.meshBasicMaterial);
           }
       }
       /** Define geometry and material in graph class for optimization - one actor only (graph), with only one mesh */
       this.geometry = new THREE.Geometry();
       if(graph.links instanceof Array)
       {
           this.edges = [];
           for(var i = 0; i < graph.links.length; i++)
           {
               this.edges[i] = new Edge(graph.links[i], this.minEdgeWeight, this.maxEdgeWeight, this.lineBasicMaterial);
           }
       }
   }
   catch(err)
   {
       throw "Unexpected error ocurred. " + err;
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
    var isFirstLayer = 1;
    /* From D3, use a scaling function for radial placement */
    scale = d3.scaleLinear().domain([0, (this.getNumberOfNodes())]).range([0, 2 * Math.PI]);

    /* Build nodes' meshes */
    var j = 0, pos = (-1 * (this.firstLayer / 2.0));
    console.log("this.nodes.length: " + this.nodes.length);
    for(var i = 0; i < this.nodes.length; i++)
    {
      if(i == this.firstLayer)
      {
        isFirstLayer = 0;
        // this.theta = ((this.firstLayer / this.lastLayer)  * this.theta);
        pos = -1 * Math.floor(this.lastLayer / 2);
        j = parseInt(j) + parseInt(1);
      }
      else if(i > this.firstLayer)
      {
        j = parseInt(j) + parseInt(1);
      }
      //  if(i == 0) this.setMinNode(parseInt(i*this.theta));
      //  if(i == this.nodes.length - 1) this.setMaxNode(parseInt(i*this.theta));
      this.nodes[i].buildNode(pos, this.firstLayer, j, 20, this.theta, layout, isFirstLayer);
      pos = pos + 1;
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

/**
 * @constructor
 * @param {Object} nodeObject The node object taken from the JSON file.
 * @param {int} min Min value to be used in feature scaling.
 * @param {int} max Max value to be used in feature scaling.
 * @param {Object} circleGeometry A geometry of type circle (from three.js).
 * @param {Object} meshBasicMaterial Material for geometry (from three.js).
 */
var Node = function(nodeObject, min, max, circleGeometry, meshBasicMaterial)
{
    min = ecmaStandard(min, 0);
    max = ecmaStandard(max, 10);
    circleGeometry = ecmaStandard(circleGeometry, undefined);
    meshBasicMaterial = ecmaStandard(meshBasicMaterial, undefined);
    try
    {
        this.nodeObject = nodeObject;
        if(this.nodeObject.weight == undefined)
        {
            this.nodeObject.weight = 1;
        }
        /* Use feature scaling to fit nodes */
        var x = (this.nodeObject.weight - min)/(max-min) + 1.5;
        this.circleGeometry = new THREE.CircleGeometry(x, 32);
        this.meshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.FrontSide, depthFunc: THREE.AlwaysDepth });
        // if(circleGeometry == undefined)
        // {
        //     this.circleGeometry = new THREE.CircleGeometry(1, 32);
        // }
        // else
        // {
        //     this.circleGeometry = circleGeometry;
        // }
        //
        // if(meshBasicMaterial == undefined)
        // {
        //     this.meshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.FrontSide, depthFunc: THREE.AlwaysDepth });
        // }
        // else
        // {
        //   this.meshBasicMaterial = meshBasicMaterial;
        // }
    }
    catch(err)
    {
        throw "Constructor must have nodeObject type as first parameter! " + err;
    }
    finally
    {
        this.circle = new THREE.Mesh(this.circleGeometry, this.meshBasicMaterial);
        this.circle.scale.set(x, x, x);
        this.circle.name = "" + this.nodeObject.id;
        this.circle.geometry.computeFaceNormals();
        this.circle.geometry.computeBoundingBox();
        this.circle.geometry.computeBoundingSphere();
        this.circle.geometry.verticesNeedUpdate = true;
        this.circle.renderOrder = 1;
    }
}

/**
 * Getter for node via copy, not reference.
 * @public
 * @returns {Object} Node type object.
 */
Node.prototype.getNode = function()
{
    var node = new Node();
    node.setCircleGeometry(this.circleGeometry);
    node.setMeshBasicMaterial(this.meshBasicMaterial);
    node.setCircle(this.circle);
    return node;
}

/**
 * Sets the current node with new node attributes.
 * @public
 * @param {Object} node Node for copying.
 */
Node.prototype.setNode = function(node)
{
    this.setCircleGeometry(node.circleGeometry);
    this.setMeshBasicMaterial(node.meshBasicMaterial);
    this.setCircle(node.circle);
}

/**
 * Getter for circleGeometry.
 * @public
 * @returns {Object} THREE.CircleGeometry type object.
 */
Node.prototype.getCircleGeometry = function()
{
    return this.circleGeometry;
}

/**
 * Setter for circleGeometry.
 * @public
 * @param {Object} circleGeometry THREE.CircleGeometry type object.
 */
Node.prototype.setCircleGeometry = function(circleGeometry)
{
    this.circleGeometry = circleGeometry;
}

/**
 * Getter for meshBasicMaterial.
 * @public
 * @returns {Object} THREE.MeshBasicMaterial type object.
 */
Node.prototype.getMeshBasicMaterial = function()
{
    return this.meshBasicMaterial;
}

/**
 * Setter for meshBasicMaterial.
 * @public
 * @param {Object} meshBasicMaterial THREE.MeshBasicMaterial type object.
 */
Node.prototype.setMeshBasicMaterial = function(meshBasicMaterial)
{
    this.meshBasicMaterial = meshBasicMaterial;
}

/**
 * Getter for circle.
 * @public
 * @returns {Object} THREE.Mesh type object.
 */
Node.prototype.getCircle = function()
{
    return this.circle;
}

/**
 * Setter for circle.
 * @public
 * @param {Object} circle THREE.Mesh type object.
 */
Node.prototype.setCircle = function(circle)
{
    this.circle = circle;
}

/**
 * Build node into scene.
 * @public
 * @param {int} index Index of current node.
 * @param {int} firstLayer Number of nodes in first layer of bipartite graph.
 * @param {int} lastLayer Number of nodes in second (or last) layer of bipartite graph.
 * @param {int} alpha Value for spacing of parallel lines.
 * @param {int} theta Used to define distance of nodes.
 * @param {int} layout Used for checking if layout is either vertical bipartite (0) or horizontal bipartite (1).
 * @param {int} isFirstLayer Boolean to check if first layer is being constructed.
 */
Node.prototype.buildNode = function(index, firstLayer, lastLayer, alpha, theta, layout, isFirstLayer)
{
    switch(layout)
    {
        /** Radial layout */
        case 1:
            this.buildRadial(theta);
            break;
        /** Bipartite layout - horizontal */
        case 2:
            this.buildBipartite(index, firstLayer, lastLayer, alpha, theta, 1, isFirstLayer);
            break;
        /** Bipartite layout - vertical */
        case 3:
            this.buildBipartite(index, firstLayer, lastLayer, alpha, theta, 0, isFirstLayer);
            break;
        default:
            break;
    }
}

/**
 * Build node into scene, using a radial layout.
 * @public
 * @param {int} theta Used in the parametric equation of radial layout.
 */
Node.prototype.buildRadial = function(theta)
{
    /* Parametric equation of a circle */
    var x = 15.00000 * Math.sin(theta);
    var y = 15.00000 * Math.cos(theta);
    // console.log("x: " + x);
    // console.log("y: " + y);
    this.circle.position.set(x, y, 0);
}

/**
 * Build node into scene, using a bipartite layout.
 * @public
 * @param {int} index Index of node being positioned.
 * @param {int} firstLayer Number of nodes in first layer of bipartite graph.
 * @param {int} lastLayer Number of nodes in second (or last) layer of bipartite graph.
 * @param {int} alpha Value for spacing of parallel lines.
 * @param {int} theta sed to define distance of nodes.
 * @param {int} horizontal Boolean to check if layout is bipartite horizontal or vertical.
 */
Node.prototype.buildBipartite = function(index, firstLayer, lastLayer, alpha, theta, horizontal, isFirstLayer)
{
    /* Separate vertical lines according to number of layers */
    // if(index >= firstLayer)
    if(isFirstLayer != 1)
    {
        var y = alpha;
        // index = lastLayer;
    }
    else
    {
        var y = alpha * (-1);
    }
    x = index * theta;
    console.log(y);
    horizontal ? this.circle.position.set(x, y, 0) : this.circle.position.set(y, x, 0);
}

/**
 * Highlight node.
 * @public
 */
Node.prototype.highlight = function()
{
    this.circle.material.color.setHex(0xFF0000);
}

/**
 * Unhighlight node.
 * @public
 */
Node.prototype.unhighlight = function()
{
    this.circle.material.color.setHex(0x000000);
}

var bipartiteGraph /* Global variables */
var renderer;
var graph;
var scene;
var camera;
var light;
var controls;
var eventHandler;
var layout = 2;
var capture = false;
var clicked = {wasClicked: false};

/* Check to see if any node is highlighted, and highlight its corresponding edges */
// $('#WebGL').on('mousemove', function(){
//   console.log("Ta vindo aqui?");
//   if(eventHandler !== undefined)
//   {
//     var highlightedElements = eventHandler.getHighlightedElements();
//     if(bipartiteGraph !== undefined)
//     {
//         bipartiteGraph.highlightEdges(highlightedElements);
//     }
//   }
// });

/**
 * Display bipartiteGraph info on HTML page.
 * @public
 * @param {JSON} jason .json file representing bipartiteGraph.
 */
function displayGraphInfo(jason)
{
  // console.log(jason);
  /* Display number of vertices */
  jason.graphInfo[0].vlayer !== undefined ? document.getElementById("numberOfVertices").innerHTML = parseInt(jason.graphInfo[0].vlayer.split(" ")[0]) + parseInt(jason.graphInfo[0].vlayer.split(" ")[1]) : document.getElementById("numberOfVertices").innerHTML = parseInt(jason.graphInfo[0].vertices.split(" ")[0]) + parseInt(jason.graphInfo[0].vertices.split(" ")[1]);
  /* Display number of edges */
  document.getElementById("numberOfEdges").innerHTML = parseInt(jason.graphInfo[0].edges);
  /* Display number of vertices in first set */
  jason.graphInfo[0].vlayer !== undefined ? document.getElementById("firstSet").innerHTML = parseInt(jason.graphInfo[0].vlayer.split(" ")[0]) : document.getElementById("firstSet").innerHTML = parseInt(jason.graphInfo[0].vertices.split(" ")[0])
  /* Display number of vertices in second set */
  jason.graphInfo[0].vlayer !== undefined ? document.getElementById("secondSet").innerHTML = parseInt(jason.graphInfo[0].vlayer.split(" ")[1]) : document.getElementById("secondSet").innerHTML = parseInt(jason.graphInfo[0].vertices.split(" ")[1])
}

function disposeNode (node)
{
    if (node instanceof THREE.Mesh)
    {
        if (node.geometry)
        {
            node.geometry.dispose();
            node.geometry = null;
        }

        if (node.material)
        {
            if (node.material instanceof THREE.MeshFaceMaterial)
            {
                $.each (node.material.materials, function (idx, mtrl)
                {
                    if (mtrl.map)           mtrl.map.dispose(), mtrl.map = null;
                    if (mtrl.lightMap)      mtrl.lightMap.dispose(), mtrl.lightMap = null;
                    if (mtrl.bumpMap)       mtrl.bumpMap.dispose(), mtrl.bumpMap = null;
                    if (mtrl.normalMap)     mtrl.normalMap.dispose(), mtrl.normalMap = null;
                    if (mtrl.specularMap)   mtrl.specularMap.dispose(), mtrl.specularMap = null;
                    if (mtrl.envMap)        mtrl.envMap.dispose(), mtrl.envMap = null;

                    mtrl.dispose();    // disposes any programs associated with the material
                    mtrl = null;
                });
            }
            else
            {
                if (node.material.map)          node.material.map.dispose(), node.material.map = null;
                if (node.material.lightMap)     node.material.lightMap.dispose(), node.material.lightMap = null;
                if (node.material.bumpMap)      node.material.bumpMap.dispose(), node.material.bumpMap = null;
                if (node.material.normalMap)    node.material.normalMap.dispose(), node.material.normalMap = null;
                if (node.material.specularMap)  node.material.specularMap.dispose(), node.material.specularMap = null;
                if (node.material.envMap)       node.material.envMap.dispose(), node.material.envMap = null;

                node.material.dispose();   // disposes any programs associated with the material
                node.material = null;
            }
        }

        node = null;
    }
}   // disposeNode

function disposeHierarchy (node, callback)
{
    for (var i = node.children.length - 1; i >= 0; i--)
    {
        var child = node.children[i];
        disposeHierarchy (child, callback);
        callback (child);
    }
}


/**
  * Render a bipartite graph, given a .json file.
  * @public
  * @param {string} data String graph to be parsed into JSON notation and rendered.
  * @param {int} layout Graph layout. Default is 2 (bipartite horizontal).
  */
function build(data, layout)
{
  lay = ecmaStandard(layout, 2);
  /* Converting text string to JSON */
  var jason = JSON.parse(data);

  /* Display bipartite graph info */
  displayGraphInfo(jason);

  /* Instantiating Graph */
  if(bipartiteGraph !== undefined) delete bipartiteGraph;
  bipartiteGraph = new BipartiteGraph(jason, 10, 70);

  if(renderer == undefined)
  {
      /* Get the size of the inner window (content area) to create a full size renderer */
      canvasWidth = (document.getElementById("WebGL").clientWidth);
      canvasHeight = (document.getElementById("WebGL").clientHeight);
      /* Create a new WebGL renderer */
      renderer = new THREE.WebGLRenderer({antialias:true});
      /* Set the background color of the renderer to black, with full opacity */
      renderer.setClearColor("rgb(255, 255, 255)", 1);
      /* Set the renderers size to the content area size */
      renderer.setSize(canvasWidth, canvasHeight);
  }
  else
  {
      renderer.setRenderTarget(null);
      renderer.clear();
  }

  /* Create scene */
  if(scene !== undefined)
  {
    disposeHierarchy(scene, disposeNode);
    for(var i = scene.children.length - 1; i >= 0; i--)
    {
      scene.remove(scene.children[i]);
    }
    // delete scene;
  }
  else
  {
    scene = new THREE.Scene();
  }

  // if(renderer !== undefined)
  // {
  //   // var element = document.getElementsByTagName("canvas");
  //   // element[0].parentNode.removeChild(element[0]);
  //   document.getElementById("WebGL").removeChild(renderer.domElement);
  //   delete renderer;
  // }
  // /* Get the size of the inner window (content area) to create a full size renderer */
  // canvasWidth = (document.getElementById("WebGL").clientWidth);
  // canvasHeight = (document.getElementById("WebGL").clientHeight);
  // /* Create a new WebGL renderer */
  // renderer = new THREE.WebGLRenderer({antialias:true});
  // /* Set the background color of the renderer to black, with full opacity */
  // renderer.setClearColor("rgb(255, 255, 255)", 1);
  // /* Set the renderers size to the content area size */
  // renderer.setSize(canvasWidth, canvasHeight);

  /* Get the DIV element from the HTML document by its ID and append the renderers' DOM object to it */
  document.getElementById("WebGL").appendChild(renderer.domElement);

  /* Build bipartiteGraph */
  bipartiteGraph.buildGraph(jason, scene, lay);

  delete jason;

  /* Create the camera and associate it with the scene */
  if(camera !== undefined) delete camera;
  camera = new THREE.PerspectiveCamera(120, canvasWidth / canvasHeight, 1, 2000);
  camera.position.set(0, 0, 70);
  camera.lookAt(scene.position);
  camera.name = "camera";
  scene.add(camera);

  /* Create simple directional light */
  if(light !== undefined) delete light;
  light = new THREE.DirectionalLight();
  light.position.set(0, 0, 10);
  scene.add(light);

  /* Using orbitControls for moving */
  if(controls !== undefined) delete controls;
  var controls = new THREE.OrbitControls(camera, renderer.domElement);

  /* Setting up params */
  controls.minDistance = 1;
  controls.maxDistance = 500;
  controls.zoomSpeed = 1.5;
  controls.target.set(0, 0, 0);
  controls.enableRotate = false;
  controls.enableKeys = false;

  controls.mouseButtons = { PAN: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, ORBIT: THREE.MOUSE.RIGHT };

  /** Creating event listener */
  if(eventHandler === undefined)
  {
    eventHandler = new EventHandler(undefined);
    /* Adding event listeners */
    document.addEventListener('resize', function(evt){
      camera.aspect = document.getElementById("WebGL").clientWidth / document.getElementById("WebGL").clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(document.getElementById("WebGL").clientWidth, document.getElementById("WebGL").clientHeight);
    }, false);
    document.addEventListener('mousemove', function(evt){eventHandler.mouseMoveEvent(evt, renderer, scene);}, false);
    // document.addEventListener('dblclick', function(evt){
    //   eventHandler.mouseDoubleClickEvent(clicked, evt, bipartiteGraph);
    //   // !clicked ? clicked = true : clicked = false;
    // }, false);
  }
  // if(eventHandler !== undefined) eventHandler.setScene(scene);
  // else
  // {
  //   eventHandler = new EventHandler(undefined, scene);
  //   /* Adding event listeners */
  //   document.addEventListener('resize', function(evt){
  //     camera.aspect = document.getElementById("WebGL").clientWidth / document.getElementById("WebGL").clientHeight;
  //     camera.updateProjectionMatrix();
  //     renderer.setSize(document.getElementById("WebGL").clientWidth, document.getElementById("WebGL").clientHeight);
  //   }, false);
  //   document.addEventListener('mousemove', function(evt){eventHandler.mouseMoveEvent(evt, renderer, bipartiteGraph);}, false);
  //   document.addEventListener('dblclick', function(evt){
  //     eventHandler.mouseDoubleClickEvent(clicked, evt, bipartiteGraph);
  //     // !clicked ? clicked = true : clicked = false;
  //   }, false);
  // }

  // console.log(renderer.info);
  animate();

  function animate()
  {
      /* Render scene */
      renderer.render(scene, camera);

      /* Tell the browser to call this function when page is visible */
      requestAnimationFrame(animate);

      /* Capture graph image (when requested) */
      if(capture)
      {
        capture = false;
        var dataURL = document.getElementsByTagName('canvas')[0].toDataURL('image/png');
        var wd = window.open('about:blank', 'graph');
        wd.document.write("<img src='" + dataURL + "' alt='from canvas'/>");
        wd.document.close();
      }
  }
}

/**
 * @desc Base class for pre ECMAScript2015 standardization.
 * @author Diego S. Cintra
 */
var ecmaStandard = function(variable, defaultValue)
{
  return variable !== undefined ? variable : defaultValue;
}

/**
 * Base class for a Event handler, implementing Event interface.
 * @author Diego S. Cintra
 */

/**
 * Constructor
 * params:
 *    - raycaster: defined raycaster, defaults to creating a new one.
 */
var EventHandler = function(raycaster)
{
    this.raycaster = ecmaStandard(raycaster, new THREE.Raycaster());
    this.raycaster.linePrecision = 0.1;
    // this.scene = ecmaStandard(scene, new THREE.Scene());
    this.highlightedElements = [];
    this.neighbors = [];
}

/**
 * Getter for raycaster
 */
EventHandler.prototype.getRaycaster = function()
{
    return this.raycaster;
}

/**
 * Setter for raycaster
 */
EventHandler.prototype.setRaycaster = function(raycaster)
{
    this.raycaster = raycaster;
}

// /**
//  * Getter for scene
//  */
// EventHandler.prototype.getScene = function()
// {
//     return this.scene;
// }
//
// /**
//  * Setter for scene
//  */
// EventHandler.prototype.setScene = function(scene)
// {
//     this.scene = scene;
// }

/**
 * Getter for highlighted elements
 */
EventHandler.prototype.getHighlightedElements = function()
{
    return this.highlightedElements;
}

/**
 * Setter for highlighted elements
 * param:
 *    - highlighted: array of highlighted elements.
 */
EventHandler.prototype.setHighlightedElements = function(highlighted)
{
    this.highlightedElements = highlighted;
}

/**
 * Handles mouse double click. If mouse double clicks vertex, highlight it and its neighbors, as well as its edges
 * params:
 *    - clicked: boolean to indicate if element has already been clicked.
 *    - evt: event dispatcher.
 *    - scene: scene for raycaster.
 */
// EventHandler.prototype.mouseDoubleClickEvent = function(clicked, evt, scene)
// {
//   if(!clicked.wasClicked)
//   {
//     /* Find highlighted vertex and highlight its neighbors */
//     for(var i = 0; i < this.highlightedElements.length; i++)
//     {
//       var element = graph.getElementById(this.highlightedElements[i]);
//       if(element instanceof Node)
//       {
//         /* Search neighbors */
//         this.neighbors = graph.findNeighbors(element);
//         /* Add itself for highlighting */
//         this.neighbors.push(element);
//         /* Remove itself so it won't unhighlight as soon as mouse moves out */
//         this.highlightedElements.splice(i, 1);
//         /* Highlight neighbors */
//         for(var j = 0; j < this.neighbors.length; j++)
//         {
//           if(this.neighbors[j] instanceof Node)
//           {
//             this.neighbors[j].highlight();
//             clicked.wasClicked = true;
//           }
//         }
//       }
//     }
//   }
//   else if(clicked.wasClicked)
//   {
//     clicked.wasClicked = false;
//     /* An element was already clicked and its neighbors highlighted; unhighlight all */
//     for(var i = 0; i < this.neighbors.length; i++)
//     {
//       var element = undefined;
//       if(this.neighbors[i] instanceof Node)
//       {
//         element = graph.getElementById(String(this.neighbors[i].circle.name));
//         element.unhighlight();
//       }
//       else if(this.neighbors[i] instanceof Edge)
//         element = graph.getElementById(String(this.neighbors[i].edgeObject.id));
//     }
//     /* Clearing array of neighbors */
//     this.neighbors = [];
//   }
// }

/**
 * Handles mouse move. If mouse hovers over element, invoke highlighting
 * params:
 *    - evt: event dispatcher;
 *    - renderer: WebGL renderer, containing DOM element's offsets;
 *    - graph: graph, containing objects to be intersected.
 */
EventHandler.prototype.mouseMoveEvent = function(evt, renderer, scene)
{
    /* Get canvas element and adjust x and y to element offset */
    var canvas = renderer.domElement.getBoundingClientRect();
    var x = evt.clientX - canvas.left;
    var y = evt.clientY - canvas.top;
    // console.log("x: " + x + " y: " + y);

    /* Adjusting mouse coordinates to NDC [-1, 1] */
    var mouseX = (x / renderer.domElement.clientWidth) * 2 - 1;
    var mouseY = -(y / renderer.domElement.clientHeight) * 2 + 1;

    var mouse = new THREE.Vector2(mouseX, mouseY);
    var camera = scene.getObjectByName("camera", true);

    /* Setting raycaster starting from camera */
    this.raycaster.setFromCamera(mouse, camera);

    /* Execute ray tracing */
    var intersects = this.raycaster.intersectObjects(scene.children, true);
    var intersection = intersects[0];

    /* Unhighlight any already highlighted element */
    for(var i = 0; i < this.highlightedElements.length; i++)
    {
        // var element = graph.getElementById(this.highlightedElements[i]);
        // var element = scene.getObjectByName(this.highlightedElements[i], true);
        // if(element != undefined)
        // {
        //   element.material.color.setHex(0x000000);
        // }
        // var alreadyHighlighted = false;
        // for(var j = 0; j < this.neighbors.length; j++)
        // {
        //   var el = undefined;
        //   if(this.neighbors[j] instanceof Node)
        //     el = this.neighbors[j].circle.name;
        //   else if(this.neighbors[j] instanceof Edge)
        //     el = this.neighbors[j].edgeObject.id;
        //   if(element === graph.getElementById(el))
        //     alreadyHighlighted = true;
        // }
        // if(!alreadyHighlighted)
        //   element.unhighlight();
        var endPoint = this.highlightedElements[i] + 32;
        var element = scene.getObjectByName("MainMesh", true);
        for(var j = this.highlightedElements[i]; j < endPoint; j++)
        {
          element.geometry.faces[j].color.setRGB(0.0, 0.0, 0.0);
        }
        element.geometry.colorsNeedUpdate = true;
        this.highlightedElements.splice(i, 1);
    }
    /* Highlight element (if intersected) */
    if(intersection != undefined)
    {

      console.log(intersection);
      if(intersection.face) /** Intersection with vertice */
      {
        intersection.face.color.setRGB(0.0, 1.0, 0.0);
        /** face.c position is starting vertex; find the difference between face.a and face.c, and color next 32 vertices to color entire cirle */
        var endPoint = intersection.faceIndex-(intersection.face.a-intersection.face.c)+1 + 32;
        for(var i = intersection.faceIndex-(intersection.face.a-intersection.face.c)+1; i < endPoint; i++)
        {
            intersection.object.geometry.faces[i].color.setRGB(1.0, 0.0, 0.0);
        }
        intersection.object.geometry.colorsNeedUpdate = true;
        this.highlightedElements.push(intersection.faceIndex-(intersection.face.a-intersection.face.c)+1);
      }
      else /** Intersection with edge */
      {

      }
        // var element = graph.getElementById(intersection.object.name);
        // var element = scene.getObjectByName(intersection.object.name);
        // element.material.color.setHex(0xFF0000);
        // document.getElementById("graphID").innerHTML = element.name;
        // if(element.description !== undefined)
        //   document.getElementById("graphDescription").innerHTML = element.description;
        // else
        //   document.getElementById("graphDescription").innerHTML = "No description found.";
        // this.highlightedElements.push(intersection.object.name);
    }
}

/**
 * Handles hovering out of an element in scene
 * params:
 *    - graph: graph, containing objects to be intersected.
 */
EventHandler.prototype.mouseOutEvent = function(graph)
{
    for(var i = 0; i < this.highlightedElements.length; i++)
    {
        // var element = graph.getElementById(this.highlightedElements[i]);
        // var element = scene.getObjectByName(this.highlightedElements[i], true);
        // element.material.color.setHex(0x000000);
    }

    /* Clearing array of highlighted elements */
    this.highlightedElements = [];
}

/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finger swipe

THREE.OrbitControls = function ( object, domElement ) {

	this.object = object;

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the object orbits around
	this.target = new THREE.Vector3();

	// How far you can dolly in and out ( PerspectiveCamera only )
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// How far you can zoom in and out ( OrthographicCamera only )
	this.minZoom = 0;
	this.maxZoom = Infinity;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	this.minAzimuthAngle = - Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	// Set to true to enable damping (inertia)
	// If damping is enabled, you must call controls.update() in your animation loop
	this.enableDamping = false;
	this.dampingFactor = 0.25;

	// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
	// Set to false to disable zooming
	this.enableZoom = true;
	this.zoomSpeed = 1.0;

	// Set to false to disable rotating
	this.enableRotate = true;
	this.rotateSpeed = 1.0;

	// Set to false to disable panning
	this.enablePan = true;
	this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

	// Set to true to automatically rotate around the target
	// If auto-rotate is enabled, you must call controls.update() in your animation loop
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// Set to false to disable use of the keys
	this.enableKeys = true;

	// The four arrow keys
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

	// Mouse buttons
	this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };

	// for reset
	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.zoom0 = this.object.zoom;

	//
	// public methods
	//

	this.getPolarAngle = function () {

		return spherical.phi;

	};

	this.getAzimuthalAngle = function () {

		return spherical.theta;

	};

	this.saveState = function () {

		scope.target0.copy( scope.target );
		scope.position0.copy( scope.object.position );
		scope.zoom0 = scope.object.zoom;

	};

	this.reset = function () {

		scope.target.copy( scope.target0 );
		scope.object.position.copy( scope.position0 );
		scope.object.zoom = scope.zoom0;

		scope.object.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );

		scope.update();

		state = STATE.NONE;

	};

	// this method is exposed, but perhaps it would be better if we can make it private...
	this.update = function () {

		var offset = new THREE.Vector3();

		// so camera.up is the orbit axis
		var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().inverse();

		var lastPosition = new THREE.Vector3();
		var lastQuaternion = new THREE.Quaternion();

		return function update() {

			var position = scope.object.position;

			offset.copy( position ).sub( scope.target );

			// rotate offset to "y-axis-is-up" space
			offset.applyQuaternion( quat );

			// angle from z-axis around y-axis
			spherical.setFromVector3( offset );

			if ( scope.autoRotate && state === STATE.NONE ) {

				rotateLeft( getAutoRotationAngle() );

			}

			spherical.theta += sphericalDelta.theta;
			spherical.phi += sphericalDelta.phi;

			// restrict theta to be between desired limits
			spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );

			// restrict phi to be between desired limits
			spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );

			spherical.makeSafe();


			spherical.radius *= scale;

			// restrict radius to be between desired limits
			spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

			// move target to panned location
			scope.target.add( panOffset );

			offset.setFromSpherical( spherical );

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion( quatInverse );

			position.copy( scope.target ).add( offset );

			scope.object.lookAt( scope.target );

			if ( scope.enableDamping === true ) {

				sphericalDelta.theta *= ( 1 - scope.dampingFactor );
				sphericalDelta.phi *= ( 1 - scope.dampingFactor );

			} else {

				sphericalDelta.set( 0, 0, 0 );

			}

			scale = 1;
			panOffset.set( 0, 0, 0 );

			// update condition is:
			// min(camera displacement, camera rotation in radians)^2 > EPS
			// using small-angle approximation cos(x/2) = 1 - x^2 / 8

			if ( zoomChanged ||
				lastPosition.distanceToSquared( scope.object.position ) > EPS ||
				8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

				scope.dispatchEvent( changeEvent );

				lastPosition.copy( scope.object.position );
				lastQuaternion.copy( scope.object.quaternion );
				zoomChanged = false;

				return true;

			}

			return false;

		};

	}();

	this.dispose = function () {

		scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
		scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		scope.domElement.removeEventListener( 'wheel', onMouseWheel, false );

		scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
		scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
		scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		window.removeEventListener( 'keydown', onKeyDown, false );

		//scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?

	};

	//
	// internals
	//

	var scope = this;

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };

	var STATE = { NONE: - 1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY: 4, TOUCH_PAN: 5 };

	var state = STATE.NONE;

	var EPS = 0.000001;

	// current position in spherical coordinates
	var spherical = new THREE.Spherical();
	var sphericalDelta = new THREE.Spherical();

	var scale = 1;
	var panOffset = new THREE.Vector3();
	var zoomChanged = false;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var panStart = new THREE.Vector2();
	var panEnd = new THREE.Vector2();
	var panDelta = new THREE.Vector2();

	var dollyStart = new THREE.Vector2();
	var dollyEnd = new THREE.Vector2();
	var dollyDelta = new THREE.Vector2();

	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.zoomSpeed );

	}

	function rotateLeft( angle ) {

		sphericalDelta.theta -= angle;

	}

	function rotateUp( angle ) {

		sphericalDelta.phi -= angle;

	}

	var panLeft = function () {

		var v = new THREE.Vector3();

		return function panLeft( distance, objectMatrix ) {

			v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
			v.multiplyScalar( - distance );

			panOffset.add( v );

		};

	}();

	var panUp = function () {

		var v = new THREE.Vector3();

		return function panUp( distance, objectMatrix ) {

			v.setFromMatrixColumn( objectMatrix, 1 ); // get Y column of objectMatrix
			v.multiplyScalar( distance );

			panOffset.add( v );

		};

	}();

	// deltaX and deltaY are in pixels; right and down are positive
	var pan = function () {

		var offset = new THREE.Vector3();

		return function pan( deltaX, deltaY ) {

			var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

			if ( scope.object.isPerspectiveCamera ) {

				// perspective
				var position = scope.object.position;
				offset.copy( position ).sub( scope.target );
				var targetDistance = offset.length();

				// half of the fov is center to top of screen
				targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

				// we actually don't use screenWidth, since perspective camera is fixed to screen height
				panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
				panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );

			} else if ( scope.object.isOrthographicCamera ) {

				// orthographic
				panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
				panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );

			} else {

				// camera neither orthographic nor perspective
				console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
				scope.enablePan = false;

			}

		};

	}();

	function dollyIn( dollyScale ) {

		if ( scope.object.isPerspectiveCamera ) {

			scale /= dollyScale;

		} else if ( scope.object.isOrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;

		}

	}

	function dollyOut( dollyScale ) {
		if ( scope.object.isPerspectiveCamera ) {

			scale *= dollyScale;

		} else if ( scope.object.isOrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;

		}

	}

	/* Zoom in */
  $('#zoomIn').on('click', function(){
    /* Creates a jQuery event for mouseWheel */
    // var evt = jQuery.Event("wheel", {delta: 650});
    // var evt = jQuery.Event("wheel", {delta: 650});
    // /* Triggers a mousewheel function */
    // $('#WebGL').trigger(evt);
    dollyOut( getZoomScale() );
		scope.update();
  });

  /* Zoom out */
  $('#zoomOut').on('click', function(){
    /* Creates a jQuery event for mouseWheel */
    // var evt = jQuery.Event("wheel", {delta: -650});
    // /* Triggers a mousewheel function */
    // $('#WebGL').trigger(evt);
    dollyIn( getZoomScale() );
		scope.update();
  });

	/* Pan left */
	$('#panLeft').on('click', function(){
		/* Reset camera to initial position */
		scope.reset();
		/* Apply pan */
		pan((graph.getNumberOfNodes())/2, 0);
		scope.update();
	});

	/* Pan right */
	$('#panRight').on('click', function(){
		/* Reset camera to initial position */
		scope.reset();
		/* Apply pan */
		pan(-(graph.getNumberOfNodes())*4, 0);
		scope.update();
	});

	//
	// event callbacks - update the object state
	//

	function handleMouseDownRotate( event ) {

		//console.log( 'handleMouseDownRotate' );

		rotateStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownDolly( event ) {

		//console.log( 'handleMouseDownDolly' );

		dollyStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownPan( event ) {

		//console.log( 'handleMouseDownPan' );

		panStart.set( event.clientX, event.clientY );

	}

	function handleMouseMoveRotate( event ) {

		//console.log( 'handleMouseMoveRotate' );

		rotateEnd.set( event.clientX, event.clientY );
		rotateDelta.subVectors( rotateEnd, rotateStart );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleMouseMoveDolly( event ) {

		//console.log( 'handleMouseMoveDolly' );

		dollyEnd.set( event.clientX, event.clientY );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyIn( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyOut( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleMouseMovePan( event ) {

		//console.log( 'handleMouseMovePan' );

		panEnd.set( event.clientX, event.clientY );

		panDelta.subVectors( panEnd, panStart );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}

	function handleMouseUp( event ) {

		// console.log( 'handleMouseUp' );

	}

	function handleMouseWheel( event ) {

		// console.log( 'handleMouseWheel' );

		if ( event.deltaY < 0 ) {

			dollyOut( getZoomScale() );

		} else if ( event.deltaY > 0 ) {

			dollyIn( getZoomScale() );

		}

		scope.update();

	}

	function handleKeyDown( event ) {

		//console.log( 'handleKeyDown' );

		switch ( event.keyCode ) {

			case scope.keys.UP:
				pan( 0, scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.BOTTOM:
				pan( 0, - scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.LEFT:
				pan( scope.keyPanSpeed, 0 );
				scope.update();
				break;

			case scope.keys.RIGHT:
				pan( - scope.keyPanSpeed, 0 );
				scope.update();
				break;

		}

	}

	function handleTouchStartRotate( event ) {

		//console.log( 'handleTouchStartRotate' );

		rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

	}

	function handleTouchStartDolly( event ) {

		//console.log( 'handleTouchStartDolly' );

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyStart.set( 0, distance );

	}

	function handleTouchStartPan( event ) {

		//console.log( 'handleTouchStartPan' );

		panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

	}

	function handleTouchMoveRotate( event ) {

		//console.log( 'handleTouchMoveRotate' );

		rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
		rotateDelta.subVectors( rotateEnd, rotateStart );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleTouchMoveDolly( event ) {

		//console.log( 'handleTouchMoveDolly' );

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyEnd.set( 0, distance );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyOut( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyIn( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleTouchMovePan( event ) {

		//console.log( 'handleTouchMovePan' );

		panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		panDelta.subVectors( panEnd, panStart );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}

	function handleTouchEnd( event ) {

		//console.log( 'handleTouchEnd' );

	}

	//
	// event handlers - FSM: listen for events and reset state
	//

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		switch ( event.button ) {

			case scope.mouseButtons.ORBIT:

				if ( scope.enableRotate === false ) return;

				handleMouseDownRotate( event );

				state = STATE.ROTATE;

				break;

			case scope.mouseButtons.ZOOM:

				if ( scope.enableZoom === false ) return;

				handleMouseDownDolly( event );

				state = STATE.DOLLY;

				break;

			case scope.mouseButtons.PAN:

				if ( scope.enablePan === false ) return;

				handleMouseDownPan( event );

				state = STATE.PAN;

				break;

		}

		if ( state !== STATE.NONE ) {

			document.addEventListener( 'mousemove', onMouseMove, false );
			document.addEventListener( 'mouseup', onMouseUp, false );

			scope.dispatchEvent( startEvent );

		}

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		switch ( state ) {

			case STATE.ROTATE:

				if ( scope.enableRotate === false ) return;

				handleMouseMoveRotate( event );

				break;

			case STATE.DOLLY:

				if ( scope.enableZoom === false ) return;

				handleMouseMoveDolly( event );

				break;

			case STATE.PAN:

				if ( scope.enablePan === false ) return;

				handleMouseMovePan( event );

				break;

		}

	}

	function onMouseUp( event ) {

		if ( scope.enabled === false ) return;

		handleMouseUp( event );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false || scope.enableZoom === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return;

		event.preventDefault();
		event.stopPropagation();

		handleMouseWheel( event );

		scope.dispatchEvent( startEvent ); // not sure why these are here...
		scope.dispatchEvent( endEvent );

	}

	function onKeyDown( event ) {

		if ( scope.enabled === false || scope.enableKeys === false || scope.enablePan === false ) return;

		handleKeyDown( event );

	}

	function onTouchStart( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:	// one-fingered touch: rotate

				if ( scope.enableRotate === false ) return;

				handleTouchStartRotate( event );

				state = STATE.TOUCH_ROTATE;

				break;

			case 2:	// two-fingered touch: dolly

				if ( scope.enableZoom === false ) return;

				handleTouchStartDolly( event );

				state = STATE.TOUCH_DOLLY;

				break;

			case 3: // three-fingered touch: pan

				if ( scope.enablePan === false ) return;

				handleTouchStartPan( event );

				state = STATE.TOUCH_PAN;

				break;

			default:

				state = STATE.NONE;

		}

		if ( state !== STATE.NONE ) {

			scope.dispatchEvent( startEvent );

		}

	}

	function onTouchMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1: // one-fingered touch: rotate

				if ( scope.enableRotate === false ) return;
				if ( state !== STATE.TOUCH_ROTATE ) return; // is this needed?...

				handleTouchMoveRotate( event );

				break;

			case 2: // two-fingered touch: dolly

				if ( scope.enableZoom === false ) return;
				if ( state !== STATE.TOUCH_DOLLY ) return; // is this needed?...

				handleTouchMoveDolly( event );

				break;

			case 3: // three-fingered touch: pan

				if ( scope.enablePan === false ) return;
				if ( state !== STATE.TOUCH_PAN ) return; // is this needed?...

				handleTouchMovePan( event );

				break;

			default:

				state = STATE.NONE;

		}

	}

	function onTouchEnd( event ) {

		if ( scope.enabled === false ) return;

		handleTouchEnd( event );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onContextMenu( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

	}

	//

	scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );

	scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
	scope.domElement.addEventListener( 'wheel', onMouseWheel, false );

	scope.domElement.addEventListener( 'touchstart', onTouchStart, false );
	scope.domElement.addEventListener( 'touchend', onTouchEnd, false );
	scope.domElement.addEventListener( 'touchmove', onTouchMove, false );

	window.addEventListener( 'keydown', onKeyDown, false );

	// force an update at start

	this.update();

};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;

Object.defineProperties( THREE.OrbitControls.prototype, {

	center: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .center has been renamed to .target' );
			return this.target;

		}

	},

	// backward compatibility

	noZoom: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
			return ! this.enableZoom;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
			this.enableZoom = ! value;

		}

	},

	noRotate: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
			return ! this.enableRotate;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
			this.enableRotate = ! value;

		}

	},

	noPan: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
			return ! this.enablePan;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
			this.enablePan = ! value;

		}

	},

	noKeys: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
			return ! this.enableKeys;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
			this.enableKeys = ! value;

		}

	},

	staticMoving: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
			return ! this.enableDamping;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
			this.enableDamping = ! value;

		}

	},

	dynamicDampingFactor: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
			return this.dampingFactor;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
			this.dampingFactor = value;

		}

	}

} );
