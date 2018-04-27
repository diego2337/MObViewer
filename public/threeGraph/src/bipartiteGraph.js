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
       this.graphSize = parseInt(this.firstLayer)+parseInt(this.lastLayer);
       /** Store distance between each set in a bipartite graph */
       this.distanceBetweenSets = 8;
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
 * @param {Object} graph Object containing .json graph file.
 * @param {int} i Index for node stored at 'graph' object.
 * @returns List of neighbors for given node.
 */
BipartiteGraph.prototype.findNeighbors = function(graph, i)
{
  var neighbors = [];
  /** Add itself first */
  neighbors.push(parseInt(graph.nodes[i].id));
  for(j = 0; j < graph.links.length; j++)
  {
    if(parseInt(graph.links[j].source) == parseInt(graph.nodes[i].id))
    {
      neighbors.push(parseInt(graph.links[j].target));
    }
    else if(parseInt(graph.links[j].target) == parseInt(graph.nodes[i].id))
    {
      neighbors.push(parseInt(graph.links[j].source));
    }
  }
  return neighbors;
}

/**
 * Writes properties of a given JSON object to string in geometry faces.
 * @public
 * @param {Object} singleGeometry geometry whose faces will be written with JSON properties.
 * @param {Object} jsonObject Object containing properties to be written in geometry.
 * @param {int} i Face index on geometry.
 */
BipartiteGraph.prototype.writeProperties = function(singleGeometry, jsonObject, i)
{
  for(var property in jsonObject)
  {
    if(property != "vertexes" && jsonObject.hasOwnProperty(property))
    {
      if(singleGeometry.faces[i].properties === undefined)
      {
        singleGeometry.faces[i].properties = '';
      }
      else
      {
        singleGeometry.faces[i].properties = singleGeometry.faces[i].properties +  ';';
      }
      singleGeometry.faces[i].properties = singleGeometry.faces[i].properties + property + ":" + jsonObject[property];
    }
  }
}

/**
 * Builds graph in the scene. All necessary node and edge calculations are performed, then these elements are added as actors.
 * @public
 * @param {Object} graph Object containing .json graph file.
 * @param {Object} scene The scene in which the graph will be built.
 * @param {int} layout Graph layout.
 */
BipartiteGraph.prototype.buildGraph = function(graph, scene, layout)
{
  layout = ecmaStandard(layout, 2);
  scene = ecmaStandard(scene, undefined);
  try
  {
    /** y represents space between two layers, while theta space between each vertice of each layer */
    // var y = -25;
    var y = -document.getElementById("mainSection").clientHeight/this.distanceBetweenSets;
    // var theta = graph.graphInfo[0].maxNodeWeight*1.2;
    var theta = 5;
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
      /** Using feature scale for node sizes */
      circleGeometry.scale(circleSize, circleSize, 1);
      /** Give geometry name the same as its id */
      circleGeometry.name = graph.nodes[i].id;
      if(layout == 3)
      {
        /** Translate geometry for its coordinates */
        circleGeometry.translate(y, x, 0);
        /** Push coordinates to array */
        positions.push({x: y, y: x, z: 0});
        /** Merge into singleGeometry */
        singleGeometry.merge(circleGeometry);
        /** Return geometry for reusing */
        circleGeometry.translate(-y, -x, 0);
      }
      else
      {
        /** Translate geometry for its coordinates */
        circleGeometry.translate(x, y, 0);
        /** Push coordinates to array */
        positions.push({x: x, y: y, z: 0});
        /** Merge into singleGeometry */
        singleGeometry.merge(circleGeometry);
        /** Return geometry for reusing */
        circleGeometry.translate(-x, -y, 0);
        circleGeometry.arrayOfProperties = [];
      }
      circleGeometry.name = "";
      circleGeometry.scale((1/circleSize), (1/circleSize), 1);
    }
    /** Populate vertices with additional .json information */
    for(var i = 0, j = 0; i < singleGeometry.faces.length && j < graph.nodes.length; i = i + 32, j++)
    {
      singleGeometry.faces[i].properties = JSON.stringify(graph.nodes[j]);

      // this.writeProperties(singleGeometry, graph.nodes[j], i);
      // /** Start to write coarsened vertexes information */
      // singleGeometry.faces[i].properties = singleGeometry.faces[i].properties + ";vertexes" + ":" + "[";
      // for(var k = 0; graph.nodes[j].hasOwnProperty("vertexes") && k < graph.nodes[j].vertexes.length; k++)
      // {
      //   this.writeProperties(singleGeometry, graph.nodes[j].vertexes[k], i);
      // }
      // singleGeometry.faces[i].properties = singleGeometry.faces[i].properties + "]";

      // for(var property in graph.nodes[j])
      // {
      //   if(property != "vertexes" && graph.nodes[j].hasOwnProperty(property))
      //   {
      //     if(singleGeometry.faces[i].properties === undefined)
      //     {
      //       singleGeometry.faces[i].properties = '';
      //     }
      //     else
      //     {
      //       singleGeometry.faces[i].properties = singleGeometry.faces[i].properties +  ';';
      //     }
      //     singleGeometry.faces[i].properties = singleGeometry.faces[i].properties + property + ":" + graph.nodes[j][property];
      //   }
      // }
      /** Find vertex neighbors */
      singleGeometry.faces[i].neighbors = this.findNeighbors(graph, j);
      /** Store vertex position */
      singleGeometry.faces[i].position = positions[j];
    }
    /** Create one mesh from single geometry and add it to scene */
    mesh = new THREE.Mesh(singleGeometry, material);
    mesh.name = "MainMesh";
    /** Alter render order so that node mesh will always be drawn on top of edges */
    mesh.renderOrder = 1;
    scene.add(mesh);

    mesh = null;

    circleGeometry.dispose();
    material.dispose();

    singleGeometry.dispose();
    singleGeometry = null;

    circleGeometry = null;
    material = null;

    /** Build edges */
    if(graph.links)
    {
      var edgeGeometry = new THREE.Geometry();
      for(var i = 0; i < graph.links.length; i++)
      {
        /** Calculate path */
        var sourcePos = positions[graph.links[i].source];
        var targetPos = positions[graph.links[i].target];
        var v1 = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
        var v2 = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
        edgeGeometry.vertices.push(v1);
        edgeGeometry.vertices.push(v2);
      }
      for(var i = 0, j = 0; i < edgeGeometry.vertices.length && j < graph.links.length; i = i + 2, j++)
      {
        /** Normalize edge weight */
        if(graph.links[j].weight == undefined) graph.links[j].weight = parseInt(graph.graphInfo[0].minEdgeWeight);
        // var edgeSize = (5.0 - 1.0) * ( (parseInt(graph.links[j].weight) - parseInt(graph.graphInfo[0].minEdgeWeight))/((parseInt(graph.graphInfo[0].maxEdgeWeight)-parseInt(graph.graphInfo[0].minEdgeWeight))+1) ) + 1.0;
        var edgeSize = Math.abs( (parseInt(graph.links[j].weight) - parseInt(graph.graphInfo[0].minEdgeWeight))/((parseInt(graph.graphInfo[0].maxEdgeWeight)-parseInt(graph.graphInfo[0].minEdgeWeight))+0.2) );
        edgeSize = (5.0 - 1.0) * edgeSize + 1.0;
        if(edgeSize == 0) edgeSize = parseInt(graph.graphInfo[0].minEdgeWeight);
        var linearScale = d3.scaleLinear().domain([1.000, 5.000]).range(['rgb(220, 255, 255)', 'rgb(0, 0, 255)']);
        edgeGeometry.colors[i] = new THREE.Color(linearScale(edgeSize));
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
    }
  }
  catch(err)
  {
     throw "Unexpected error ocurred at line " + err.line + ". " + err;
  }
}
