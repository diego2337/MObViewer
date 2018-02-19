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
    var y = -25, theta = parseInt(graph.graphInfo[0].maxNodeWeight)+3;
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
