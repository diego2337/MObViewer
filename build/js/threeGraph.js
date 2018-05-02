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
 * @param {int} distanceBetweenSets The distance between two independent sets in the bipartite graph.
 * @param {string} nLevel The level number which such bipartite graph corresponds.
 * @param {int} min The minimal value for feature scaling, applied to nodes and edges. Default is 0.
 * @param {int} max The maximum value for feature scaling, applied to nodes and edges. Default is 10.
 */
var BipartiteGraph = function(graph, distanceBetweenSets, nLevel, min, max)
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
       this.nLevel = ecmaStandard(nLevel, "");
       this.graphInfo.min = ecmaStandard(min, 0);
       this.graphInfo.max = ecmaStandard(max, 10);
       this.graphSize = parseInt(this.firstLayer)+parseInt(this.lastLayer);
       /** Store distance between each set in a bipartite graph */
       this.distanceBetweenSets = distanceBetweenSets;
       /** Store min and max edge weight normalized */
       this.minEdgeWeight = 1.0, this.maxEdgeWeight = 5.0;
       this.linearScale = undefined;
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
 * Renders nodes in the scene.
 * @public
 * @param {Object} graph Object containing .json graph file.
 * @param {Object} scene The scene in which the graph will be built.
 * @param {int} layout Graph layout.
 * @param {Object} firstIndependentSet Independent set where first set of nodes will be rendered.
 * @param {Object} secondIndependentSet Independent set where second set of nodes will be rendered.
 */
BipartiteGraph.prototype.renderNodes = function(graph, scene, layout, firstIndependentSet, secondIndependentSet)
{
  /** Create single geometry which will contain all geometries */
  var singleGeometry = new THREE.Geometry();
  /** y represents space between two layers, while theta space between each vertice of each layer */
  var y = -document.getElementById("mainSection").clientHeight/this.distanceBetweenSets;
  var theta = 5;
  /** Define x-axis starting position */
  var pos = (-1 * (parseInt(this.firstLayer) / 2.0));
  /** Fill an array with nodes from first set */
  var setNodes = [];
  for(var i = 0; i < parseInt(this.firstLayer); i++)
  {
    setNodes.push(graph.nodes[i]);
  }
  /** Create an independent set and render its nodes */
  firstIndependentSet.buildSet(singleGeometry, setNodes, graph.links, graph.graphInfo[0].minNodeWeight, graph.graphInfo[0].maxNodeWeight, pos, y, theta, layout);
  /** Readjust x and y-axis values */
  y = y * (-1);
  pos = -1 * Math.floor(parseInt(this.lastLayer) / 2);
  /** Clear array and fill with nodes from second set */
  setNodes = [];
  for(var i = 0; i < parseInt(this.lastLayer); i++)
  {
    setNodes.push(graph.nodes[i+parseInt(this.firstLayer)]);
  }
  /** Create an independent set and render its nodes */
  secondIndependentSet.buildSet(singleGeometry, setNodes, graph.links, graph.graphInfo[0].minNodeWeight, graph.graphInfo[0].maxNodeWeight, pos, y, theta, layout);
  /** Creating material for nodes */
  var material = new THREE.MeshLambertMaterial( {  wireframe: false, vertexColors:  THREE.FaceColors } );
  /** Create one mesh from single geometry and add it to scene */
  var mesh = new THREE.Mesh(singleGeometry, material);
  mesh.name = "MainMesh" + this.nLevel.toString();
  /** Alter render order so that node mesh will always be drawn on top of edges */
  mesh.renderOrder = 1;
  scene.add(mesh);

  /** Properly dispose of objects */
  mesh = null;
  singleGeometry.dispose();
  singleGeometry = null;
  material.dispose();
  material = null;
}

/**
 * Renders edges in the scene.
 * @public
 * @param {Object} graph Object containing .json graph file.
 * @param {Object} scene The scene in which the graph will be built.
 * @param {int} layout Graph layout.
 * @param {Object} firstIndependentSet Independent set where first set of nodes will be rendered.
 * @param {Object} secondIndependentSet Independent set where second set of nodes will be rendered.
 */
BipartiteGraph.prototype.renderEdges = function(graph, scene, layout, firstIndependentSet, secondIndependentSet)
{
  if(graph.links)
  {
    /** Get nodes positions */
    var positions = firstIndependentSet.positions.concat(secondIndependentSet.positions);
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
      // edgeSize = (5.0 - 1.0) * edgeSize + 1.0;
      edgeSize = (this.maxEdgeWeight - this.minEdgeWeight) * edgeSize + this.minEdgeWeight;
      if(edgeSize == 0) edgeSize = parseInt(graph.graphInfo[0].minEdgeWeight);
      // this.linearScale = d3.scaleLinear().domain([1.000, 5.000]).range(['rgb(220, 255, 255)', 'rgb(0, 0, 255)']);
      this.linearScale = d3.scaleLinear().domain([this.minEdgeWeight, this.maxEdgeWeight]).range(['rgb(220, 255, 255)', 'rgb(0, 0, 255)']);
      edgeGeometry.colors[i] = new THREE.Color(this.linearScale(edgeSize));
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

/**
 * Renders graph in the scene. All necessary node and edge calculations are performed, then these elements are added as actors.
 * @public
 * @param {Object} graph Object containing .json graph file.
 * @param {Object} scene The scene in which the graph will be built.
 * @param {int} layout Graph layout.
 */
BipartiteGraph.prototype.renderGraph = function(graph, scene, layout)
{
  /** Apply default values to layout and scene, in case no scene is given (will be caught by 'catch') */
  layout = ecmaStandard(layout, 2);
  scene = ecmaStandard(scene, undefined);
  try
  {
    /** Create independent sets */
    var firstIndependentSet = new IndependentSet();
    var secondIndependentSet = new IndependentSet();
    /** Build and render nodes */
    this.renderNodes(graph, scene, layout, firstIndependentSet, secondIndependentSet);

    /** Build edges */
    this.renderEdges(graph, scene, layout, firstIndependentSet, secondIndependentSet);

    /** Properly dispose of elements */
    delete firstIndependentSet;
    delete secondIndependentSet;
  }
  catch(err)
  {
     throw "Unexpected error ocurred at line " + err.line + ". " + err;
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
        // edgeSize = (5.0 - 1.0) * edgeSize + 1.0;
        edgeSize = (this.maxEdgeWeight - this.minEdgeWeight) * edgeSize + this.minEdgeWeight;
        if(edgeSize == 0) edgeSize = parseInt(graph.graphInfo[0].minEdgeWeight);
        // this.linearScale = d3.scaleLinear().domain([1.000, 5.000]).range(['rgb(220, 255, 255)', 'rgb(0, 0, 255)']);
        this.linearScale = d3.scaleLinear().domain([this.minEdgeWeight, this.maxEdgeWeight]).range(['rgb(220, 255, 255)', 'rgb(0, 0, 255)']);
        edgeGeometry.colors[i] = new THREE.Color(this.linearScale(edgeSize));
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

/**
 * Base class for Independent Set, which consists of an independent set of nodes.
 * @author Diego Cintra
 * 30 april 2018
 */

/**
 * @constructor
 */
var IndependentSet = function()
{
  /** Array to store (x,y,z) coordinates of nodes */
  this.positions = [];
}

/**
 * Find node's neighbors.
 * @public
 * @param {Array} nodes Array of objects containing .json type nodes (id, weight...).
 * @param {Array} links Array of objects containing .json type edges (source, target, weight).
 * @param {int} i Index for node stored at 'graph' object.
 * @returns List of neighbors for given node.
 */
IndependentSet.prototype.findNeighbors = function(nodes, links, i)
{
  var neighbors = [];
  /** Add itself first */
  neighbors.push(parseInt(nodes[i].id));
  for(j = 0; j < links.length; j++)
  {
    if(parseInt(links[j].source) == parseInt(nodes[i].id))
    {
      neighbors.push(parseInt(links[j].target));
    }
    else if(parseInt(links[j].target) == parseInt(nodes[i].id))
    {
      neighbors.push(parseInt(links[j].source));
    }
  }
  return neighbors;
}

/**
 * @desc Builds an independent set, given a y-axis coordinate and a theta spacing between nodes.
 * @param {Object} geometry Single geometry which will contain all node geometries, merged.
 * @param {Array} nodes Array of objects containing .json type nodes (id, weight...).
 * @param {Array} links Array of objects containing .json type edges (source, target, weight).
 * @param {float} minNodeWeight Minimum node weight for 'nodes' set.
 * @param {float} maxNodeWeight Maximum node weight for 'nodes' set.
 * @param {int} pos x-axis starting coordinate for nodes.
 * @param {int} y y-axis coordinate for nodes.
 * @param {float} theta Theta value which defines spacing between nodes.
 * @param {int} layout Graph layout.
 */
IndependentSet.prototype.buildSet = function(geometry, nodes, links, minNodeWeight, maxNodeWeight, pos, y, theta, layout)
{
  try
  {
    /** Store number of faces before adding nodes */
    var numberOfFaces = geometry.faces.length;
    /** Build nodes */
    /** Creating geometry for nodes */
    var circleGeometry = new THREE.CircleGeometry(1, 32);
    /** Color vertexes */
    for(var k = 0; k < circleGeometry.faces.length; k++)
    {
      circleGeometry.faces[k].color.setRGB(0.0, 0.0, 0.0);
    }
    for(var i = 0; i < nodes.length; i++, pos++)
    {
      var x = pos * theta;
      if(nodes[i].weight == undefined) nodes[i].weight = parseInt(minNodeWeight);
      var circleSize = (5.0 - 1.0) * ( (parseInt(nodes[i].weight) - parseInt(minNodeWeight))/((parseInt(maxNodeWeight)-parseInt(minNodeWeight))+1) ) + 1.0;
      if(circleSize == 0) circleSize = parseInt(minNodeWeight);
      /** Using feature scale for node sizes */
      circleGeometry.scale(circleSize, circleSize, 1);
      /** Give geometry name the same as its id */
      circleGeometry.name = nodes[i].id;
      if(layout == 3)
      {
        /** Translate geometry for its coordinates */
        circleGeometry.translate(y, x, 0);
        /** Push coordinates to array */
        this.positions.push({x: y, y: x, z: 0});
        /** Merge into geometry */
        geometry.merge(circleGeometry);
        /** Return geometry for reusing */
        circleGeometry.translate(-y, -x, 0);
      }
      else
      {
        /** Translate geometry for its coordinates */
        circleGeometry.translate(x, y, 0);
        /** Push coordinates to array */
        this.positions.push({x: x, y: y, z: 0});
        /** Merge into geometry */
        geometry.merge(circleGeometry);
        /** Return geometry for reusing */
        circleGeometry.translate(-x, -y, 0);
        circleGeometry.arrayOfProperties = [];
      }
      circleGeometry.name = "";
      circleGeometry.scale((1/circleSize), (1/circleSize), 1);
    }
    /** Populate vertices with additional .json information */
    for(var i = numberOfFaces, j = 0; i < geometry.faces.length && j < nodes.length; i = i + 32, j++)
    {
      geometry.faces[i].properties = JSON.stringify(nodes[j]);
      /** Find vertex neighbors - FIXME not an IndependentSet responsibility */
      geometry.faces[i].neighbors = this.findNeighbors(nodes, links, j);
      /** Store vertex position */
      geometry.faces[i].position = this.positions[j];
      /** Store vertex position */
      geometry.faces[i].position = this.positions[j];
    }

    /** Properly dispose of object */
    circleGeometry.dispose();
    circleGeometry = null;
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in function IndependentSet.renderSet. " + err;
  }
}

/**
 * @desc Base class for abstraction of all elements in scene. Reponsible for rendering bipartite graph in scene, invoking functions to generate drawings, and invoking all objects in scene. TODO - to be implemented later
 * @author Diego Cintra
 * 1 May 2018
 */

/**
 * @constructor
 */
var Layout = function()
{

}

/** Global variables */
var bipartiteGraph, gradientLegend, renderer, graph, scene, camera, light, controls, eventHandler, layout = 2, capture = false, clicked = {wasClicked: false}, graphName, numOfLevels = 0, firstSet, secondSet, bipartiteGraphs = [];
var cameraPos = document.getElementById("mainSection").clientHeight/4;
// var vueTableHeader, vueTableRows;
var vueTableHeader = new Vue({
  el: '#dynamicTableHeaders',
  data: {
    headers: ""
  }
});
var vueTableRows = new Vue({
  el: '#dynamicTableRows',
  data: {
    rows: ""
  }
});

/**
 * Display bipartiteGraph info on HTML page.
 * @public
 * @param {string} name Graph name from .json file.
 * @param {JSON} jason .json file representing bipartiteGraph.
 */
function displayGraphInfo(jason)
{
  /** TODO - Display graph info as it was done in previous commits */
  // console.log(jason);
  /** Display graph name */
  // document.getElementById("graphName").innerHTML = name;
  /* Display number of vertices */
  jason.graphInfo[0].vlayer !== undefined ? document.getElementById("numberOfVertices").innerHTML = parseInt(jason.graphInfo[0].vlayer.split(" ")[0]) + parseInt(jason.graphInfo[0].vlayer.split(" ")[1]) : document.getElementById("numberOfVertices").innerHTML = parseInt(jason.graphInfo[0].vertices.split(" ")[0]) + parseInt(jason.graphInfo[0].vertices.split(" ")[1]);
  /* Display number of edges */
  document.getElementById("numberOfEdges").innerHTML = parseInt(jason.graphInfo[0].edges);
  /* Display number of vertices in first set */
  jason.graphInfo[0].vlayer !== undefined ? document.getElementById("nVerticesFirstLayer").innerHTML = parseInt(jason.graphInfo[0].vlayer.split(" ")[0]) : document.getElementById("nVerticesFirstLayer").innerHTML = parseInt(jason.graphInfo[0].vertices.split(" ")[0])
  /* Display number of vertices in second set */
  jason.graphInfo[0].vlayer !== undefined ? document.getElementById("nVerticesSecondLayer").innerHTML = parseInt(jason.graphInfo[0].vlayer.split(" ")[1]) : document.getElementById("nVerticesSecondLayer").innerHTML = parseInt(jason.graphInfo[0].vertices.split(" ")[1])
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
 * Connect vertexes from previous level to current level, according to .cluster file.
 * @param {Array} clusters .cluster file grouped as an array.
 */
function connectLevels(clusters)
{
  console.log("Hi, I'm a newborn function yet to be implemented :3");
}

/**
 * Render a bipartite graph, given a .json file.
 * @public
 * @param {(string|Array)} data String of graph (or graphs) to be parsed into JSON notation and rendered.
 * @param {int} layout Graph layout. Default is 2 (bipartite horizontal).
 */
function build(data, layout, min, max)
{
  /** Check and treat incoming response */
  data = JSON.parse(data);
  graphName = data.graphName;
  numOfLevels = data.nLevels;
  firstSet = data.firstSet;
  secondSet = data.secondSet;
  data = data.graph;
  min = ecmaStandard(min, 10);
  max = ecmaStandard(max, 70);
  lay = ecmaStandard(layout, 2);
  /* Converting text string to JSON */
  var jason = JSON.parse(data);

  /* Display bipartite graph info */
  displayGraphInfo(jason);

  /* Instantiating Graph */
  if(bipartiteGraph !== undefined) delete bipartiteGraph;
  bipartiteGraph = new BipartiteGraph(jason, 8, "", min, max);
  // bipartiteGraph = new BipartiteGraph(jason, 10, 70);

  if(renderer == undefined)
  {
      /* Get the size of the inner window (content area) to create a full size renderer */
      canvasWidth = (document.getElementById("mainSection").clientWidth);
      canvasHeight = (document.getElementById("mainSection").clientHeight);
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
    delete scene;
  }
  else
  {
    scene = new THREE.Scene();
  }

  /* Get the DIV element from the HTML document by its ID and append the renderers' DOM object to it */
  document.getElementById("WebGL").appendChild(renderer.domElement);

  /* Build bipartiteGraph */
  // bipartiteGraph.buildGraph(jason, scene, lay);
  /* Render bipartiteGraph */
  bipartiteGraph.renderGraph(jason, scene, lay);

  if(bipartiteGraphs !== undefined) bipartiteGraphs = [];
  /** Construct new bipartite graphs from previous levels of coarsening */
  var nLevels = 0;
  // for(var i = 0; i < parseInt(numOfLevels)-1; i = i + 1)
  for(let i = parseInt(numOfLevels)-1; i > 0; i = i - 1)
  {
    var gName = graphName.split(".")[0];
    gName = gName.substring(0, gName.length-2);
    $.ajax({
      url: '/getLevels',
      type: 'POST',
      data: gName + "n" + (i).toString() + ".json",
      processData: false,
      contentType: false,
      success: function(data){
        var coarsenedBipartiteGraph = new BipartiteGraph(JSON.parse(JSON.parse(data).graph), bipartiteGraph.distanceBetweenSets - (nLevels+2), (nLevels+1).toString());
        nLevels = nLevels + 1;
        /** Render independent sets in scene */
        coarsenedBipartiteGraph.renderNodes(JSON.parse(JSON.parse(data).graph), scene, lay, new IndependentSet(), new IndependentSet());
        /** Make connections with coarsened vertexes - use ajax call to get .cluster file, containing coarsened super vertexes */
        $.ajax({
          url: '/getClusters',
          type: 'POST',
          data: gName + "n" + (i).toString() + ".cluster",
          processData: false,
          contentType: false,
          success: function(data){
            connectLevels(data);
          },
          xhr: loadGraph
        });
        // bipartiteGraphs.push(new BipartiteGraph(JSON.parse(JSON.parse(data).graph), bipartiteGraph.distanceBetweenSets - (i+1)));
        /** Render independent sets in scene */
        // bipartiteGraphs[bipartiteGraphs.length-1].renderNodes(JSON.parse(JSON.parse(data).graph), scene, lay, new IndependentSet(), new IndependentSet());
      },
      xhr: loadGraph
    });
  }

  /** Create edge gradient legend */
  if(gradientLegend !== undefined)
  {
      gradientLegend.clear();
      delete gradientLegend;
  }
  // gradientLegend = new GradientLegend(bipartiteGraph.linearScale, bipartiteGraph.graphInfo, bipartiteGraph.minEdgeWeight, bipartiteGraph.maxEdgeWeight, 300, 50);
  /** Use minimum edge weight and maximum edge weight as domain values */
  gradientLegend = new GradientLegend(bipartiteGraph.linearScale, bipartiteGraph.graphInfo.minEdgeWeight, bipartiteGraph.graphInfo.maxEdgeWeight, 300, 50, 5);
  gradientLegend.createGradientLegend("gradientScale", "Edge weights:");

  delete jason;

  /* Create the camera and associate it with the scene */
  if(camera !== undefined) delete camera;
  camera = new THREE.PerspectiveCamera(120, canvasWidth / canvasHeight, 1, 2000);
  camera.position.set(0, 0, cameraPos);
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
    document.addEventListener('dblclick', function(evt){
      eventHandler.mouseDoubleClickEvent();
      // eventHandler.mouseDoubleClickEvent(clicked, evt, bipartiteGraph);
      // !clicked ? clicked = true : clicked = false;
    }, false);
    document.addEventListener('click', function(evt){
      eventHandler.mouseClickEvent(evt, renderer, scene);
    }, false);
  }

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
 * @constructor
 * @param {Object} raycaster Defined raycaster, defaults to creating a new one.
 */
var EventHandler = function(raycaster)
{
    this.raycaster = ecmaStandard(raycaster, new THREE.Raycaster());
    this.raycaster.linePrecision = 0.1;
    this.highlightedElements = [];
    this.neighbors = [];
}

/**
 * Getter for raycaster.
 * @public
 * @returns {Object} Raycaster property from EventHandler.
 */
EventHandler.prototype.getRaycaster = function()
{
    return this.raycaster;
}

/**
 * Setter for raycaster.
 * @public
 * @param {Object} raycaster Raycaster property for EventHandler.
 */
EventHandler.prototype.setRaycaster = function(raycaster)
{
    this.raycaster = raycaster;
}

/**
 * Getter for highlighted elements.
 * @public
 * @returns {Object} Array of highlighted elements in scene.
 */
EventHandler.prototype.getHighlightedElements = function()
{
    return this.highlightedElements;
}

/**
 * Setter for highlighted elements.
 * @param {Object} highlighted Array of highlighted elements.
 */
EventHandler.prototype.setHighlightedElements = function(highlighted)
{
    this.highlightedElements = highlighted;
}

/**
 * Find index of pair of vertices that form an edge.
 * @public
 * @param {Object} vertexArray Array of vertexes to search for edge.
 * @param {Object} startEdge (x,y,z) coordinates of starting vertex.
 * @param {Object} endEdge (x,y,z) coordinates of ending vertex.
 * @returns {int} Index in vertexArray of edge.
 */
EventHandler.prototype.findEdgePairIndex = function(vertexArray, startEdge, endEdge)
{
  for(var i = 0; i < vertexArray.length; i = i + 2)
  {
    if((vertexArray[i].x == startEdge.x && vertexArray[i].y == startEdge.y && vertexArray[i].z == startEdge.z &&
       vertexArray[i+1].x == endEdge.x && vertexArray[i+1].y == endEdge.y && vertexArray[i+1].z == endEdge.z))
    {
      return i;
    }
    else if(vertexArray[i].x == endEdge.x && vertexArray[i].y == endEdge.y && vertexArray[i].z == endEdge.z &&
       vertexArray[i+1].x == startEdge.x && vertexArray[i+1].y == startEdge.y && vertexArray[i+1].z == startEdge.z)
    {
      return i+1;
    }
  }
  return -1;
}

/**
 * Handles mouse double click. If mouse double clicks vertex, highlight it and its neighbors, as well as its edges.
 * @public
 */
EventHandler.prototype.mouseDoubleClickEvent = function()
{
      if(!clicked.wasClicked)
      {
        var element = scene.getObjectByName("MainMesh", true);
        // var lineSegments = scene.getObjectById(8, true);
        // var lineSegments = scene.children[1];
        var lineSegments = scene.getObjectByProperty("type", "LineSegments");
        /** Find highlighted vertex and highlight its neighbors */
        for(var i = 0; i < this.highlightedElements.length; i++)
        {
          /** Add itself for highlighting */
          this.neighbors.push({vertexInfo: this.highlightedElements[i]/32, edgeColor: {r:0, g:0, b:0}});
          var startEdge = element.geometry.faces[this.highlightedElements[i]].position;
          // var startPosition = element.geometry.faces[this.highlightedElements[i]].positionIndex;
          for(var j = 1; j < element.geometry.faces[this.highlightedElements[i]].neighbors.length; j++)
          {
            var endPoint = ((element.geometry.faces[this.highlightedElements[i]].neighbors[j]) * 32) + 32;
            for(var k = (element.geometry.faces[this.highlightedElements[i]].neighbors[j]) * 32; k < endPoint; k++)
            {
                element.geometry.faces[k].color.setRGB(1.0, 0.0, 0.0);
            }
            clicked.wasClicked = true;
            /** Highlight connected edges */
            var neighborIndex = element.geometry.faces[this.highlightedElements[i]].neighbors[j] * 32;
            var endEdge = element.geometry.faces[neighborIndex].position;
            var index = this.findEdgePairIndex(lineSegments.geometry.vertices, startEdge, endEdge);
            /** Find index of end position */
            // var endPosition = element.geometry.faces[neighborIndex].positionIndex;
            var originalColor = {r:0, g:0, b:0};
            if(index != -1)
            {
              // originalColor = lineSegments.geometry.colors[index];
              originalColor.r = lineSegments.geometry.colors[index].r;
              originalColor.g = lineSegments.geometry.colors[index].g;
              originalColor.b = lineSegments.geometry.colors[index].b;
              lineSegments.geometry.colors[index].setRGB(1.0, 0.0, 0.0);
            }
            this.neighbors.push({vertexInfo: element.geometry.faces[this.highlightedElements[i]].neighbors[j], edgeColor: originalColor});
          }
          // lineSegments.geometry.colors[startPosition].setRGB(1.0, 0.0, 0.0);
          // lineSegments.geometry.colors[0].setRGB(1.0, 0.0, 0.0);
          /** Remove itself so it won't unhighlight as soon as mouse moves out */
          this.highlightedElements.splice(i, 1);
        }
        element.geometry.colorsNeedUpdate = true;
        lineSegments.geometry.colorsNeedUpdate = true;
      }
      else if(clicked.wasClicked)
      {
        clicked.wasClicked = false;
        /** An element was already clicked and its neighbors highlighted; unhighlight all */
        var element = scene.getObjectByName("MainMesh", true);
        // var lineSegments = scene.getObjectById(8, true);
        // var lineSegments = scene.children[1];
        var lineSegments = scene.getObjectByProperty("type", "LineSegments");
        var startEdge = element.geometry.faces[this.neighbors[0].vertexInfo*32].position;
        for(var i = 0; i < this.neighbors.length; i++)
        {
          var endPoint = (this.neighbors[i].vertexInfo * 32) + 32;
          for(var j = this.neighbors[i].vertexInfo*32; j < endPoint; j++)
          {
            element.geometry.faces[j].color.setRGB(0.0, 0.0, 0.0);
          }
          element.geometry.colorsNeedUpdate = true;
          if(i != 0)
          {
            var endEdge = element.geometry.faces[this.neighbors[i].vertexInfo*32].position;
            var index = this.findEdgePairIndex(lineSegments.geometry.vertices, startEdge, endEdge);
            if(index != -1)
            {
              // lineSegments.geometry.colors[index].setRGB(this.neighbors[i].edgeColor);
              lineSegments.geometry.colors[index].setRGB(this.neighbors[i].edgeColor.r, this.neighbors[i].edgeColor.g, this.neighbors[i].edgeColor.b);
            }
            lineSegments.geometry.colorsNeedUpdate = true;
          }
        }
        /** Clearing array of neighbors */
        this.neighbors = [];
      }
}

/**
 * Makes all necessary configurations to properly execute raycast.
 * @public
 * @param {Object} evt Event dispatcher.
 * @param {Object} renderer WebGL renderer, containing DOM element's offsets.
 * @param {Object} scene Scene for raycaster.
 * @returns {Object} intersected objects in specified scene.
 */
EventHandler.prototype.configAndExecuteRaytracing = function(evt, renderer, scene)
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
  return this.raycaster.intersectObjects(scene.children, true);
}

/**
 * Handles mouse click. If mouse clicks vertex, show its current id and weight, as well as vertexes associated with it.
 * @public
 * @param {Object} evt Event dispatcher.
 * @param {Object} renderer WebGL renderer, containing DOM element's offsets.
 * @param {Object} scene Scene for raycaster.
 */
EventHandler.prototype.mouseClickEvent = function(evt, renderer, scene)
{
  var intersects = this.configAndExecuteRaytracing(evt, renderer, scene);
  var intersection = intersects[0];
  if(intersection != undefined)
  {
    if(intersection.face) /** Intersection with vertice */
    {
      var vertices = JSON.parse(intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties);
      console.log("vertices:");
      console.log(vertices);
      var vertexVueHeaders = [], vertexVueRows = [];
      for(var j = 0; vertices.vertexes !== undefined && j < vertices.vertexes.length; j++)
      {
        if(j == 0)
        {
          for(key in vertices.vertexes[j])
          {
            vertexVueHeaders.push(key);
          }
          // console.log("vertexVueHeaders:");
          // console.log(vertexVueHeaders);
          /** Construct a new vue table header */
          vueTableHeader._data.headers = vertexVueHeaders;
        }
        vertexVueRows.push(vertices.vertexes[j]);
      }
      /** Construct a new vue table data */
      vueTableRows._data.rows = vertexVueRows;
    }
  }
  // var element = scene.getObjectByName("MainMesh", true);
  // for(var i = 0; i < this.highlightedElements.length; i++)
  // {
  //   var vertices = JSON.parse(element.geometry.faces[this.highlightedElements[i]].properties);
  //   var vertexVueHeaders = [], vertexVueRows = [];
  //   for(var j = 0; vertices.vertexes !== undefined && j < vertices.vertexes.length; j++)
  //   {
  //     if(j == 0)
  //     {
  //       for(key in vertices.vertexes[j])
  //       {
  //         vertexVueHeaders.push(key);
  //       }
  //       // console.log("vertexVueHeaders:");
  //       // console.log(vertexVueHeaders);
  //       /** Construct a new vue table header */
  //       vueTableHeader._data.headers = vertexVueHeaders;
  //     }
  //     vertexVueRows.push(vertices.vertexes[j]);
  //   }
  //   /** Construct a new vue table data */
  //   vueTableRows._data.rows = vertexVueRows;
  // }
}

/**
 * Handles mouse move. If mouse hovers over element, invoke highlighting.
 * @public
 * @param {Object} evt Event dispatcher.
 * @param {Object} renderer WebGL renderer, containing DOM element's offsets.
 * @param {Object} scene Scene for raycaster.
 */
EventHandler.prototype.mouseMoveEvent = function(evt, renderer, scene)
{
    /* Execute ray tracing */
    // var intersects = this.raycaster.intersectObjects(scene.children, true);
    var intersects = this.configAndExecuteRaytracing(evt, renderer, scene);
    var intersection = intersects[0];

    /* Unhighlight any already highlighted element - FIXME this is problematic; highlightedElements might have index of an element that is being highlighted because of a double click. Must find a way to check from which specific mesh that index is */
    for(var i = 0; i < this.highlightedElements.length; i++)
    {
      for(var j = 0; j < parseInt(numOfLevels); j++)
      {
        var endPoint = this.highlightedElements[i] + 32;
        var element;
        j == 0 ? element = scene.getObjectByName("MainMesh", true) : element = scene.getObjectByName("MainMesh" + j.toString(), true);
        // var element = scene.getObjectByName("MainMesh", true);
        for(var k = this.highlightedElements[i]; k < endPoint; k++)
        {
          if(element.geometry.faces[k] !== undefined) element.geometry.faces[k].color.setRGB(0.0, 0.0, 0.0);
        }
        element.geometry.colorsNeedUpdate = true;
      }
      this.highlightedElements.splice(i, 1);
    }
    /** Hiding vertex information */
    // document.getElementById("vertexInfo").innerHTML = "";
    // $("#vertexInfoId").css("display", "none");
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
        /** First check if vertex isn't already highlighted because of double-clicking */
        var found = this.neighbors.find(function(elmt){
          return elmt.vertexInfo == ((intersection.faceIndex-(intersection.face.a-intersection.face.c)+1)/32);
        });
        if(found == undefined)
        {
          this.highlightedElements.push(intersection.faceIndex-(intersection.face.a-intersection.face.c)+1);
        }
        /** Display vertex information */
        // properties = intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties.split(";");
        // for(var i = 0; i < intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties.split(";").length; i++)
        // {
        //     if(properties[i].length > 1)
        //     {
        //       /** if case made specifically for movieLens files */
        //       if(properties[i].indexOf("|") != -1)
        //       {
        //         genres = properties[i].split("|");
        //         for(var j = 0; j < genres.length; j++)
        //         {
        //           document.getElementById("vertexInfo").innerHTML = document.getElementById("vertexInfo").innerHTML + genres[j] + ",<br>";
        //         }
        //       }
        //       else
        //       {
        //         document.getElementById("vertexInfo").innerHTML = document.getElementById("vertexInfo").innerHTML + properties[i] + "<br>";
        //         // intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties.split(";")[i] + "<br>";
        //       }
        //     }
        // }
        // // document.getElementById("vertexInfo").innerHTML = intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties;
        // $("#vertexInfoId").css("display", "inline");
      }
      else /** Intersection with edge */
      {
        /** Do nothing (TODO - for now) */
      }
    }
}

/**
 * Base class for gradient legend, to check edge weights. Based on https://bl.ocks.org/duspviz-mit/9b6dce37101c30ab80d0bf378fe5e583
 * @author Diego S. Cintra
 * Date: 30 april 2018
 */

/**
 * @constructor
 * @param {Function} linearScale Linear scale function from d3 to map from the minimum edge weight to maximum edge weight.
 * @param {float} minDomainValue Minimum domain value.
 * @param {float} maxDomainValue Maximum domain value.
 * @param {int} width Width of gradient legend, in pixel units.
 * @param {int} height Height of gradient legend, in pixel units.
 * @param {int} ticks Number of ticks to be displayed for the y-axis.
 */
var GradientLegend = function(linearScale, minDomainValue, maxDomainValue, width, height, ticks)
{
  try
  {
    // this.graphInfo = graphInfo;
    this.spanElementId = "spanElementId";
    this.width = ecmaStandard(width, 300);
    this.height = ecmaStandard(height, 50);
    this.minDomainValue = ecmaStandard(minDomainValue, 1.0);
    this.maxDomainValue = ecmaStandard(maxDomainValue, 5.0);
    /** Default linearScale value, with assigned minimum and maximum values and color ranging from light blue to dark blue */
    var defaultLinearScale = d3.scaleLinear().domain([this.minDomainValue, this.maxDomainValue]).range(['rgb(220, 255, 255)', 'rgb(0, 0, 255)']);
    this.linearScale = ecmaStandard(linearScale, defaultLinearScale);
    this.ticks = ecmaStandard(ticks, 5);
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in GradientLegend constructor. " + err;
  }
}

/**
 * @desc Destructor equivalent function to clear page of svg elements, so that they can be deleted with 'delete' keyword.
 * @public
 */
GradientLegend.prototype.clear = function()
{
  try
  {
    d3.select("#" + this.spanElementId).remove();
    d3.select("svg").remove();
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in GradientLegend.clear. " + err;
  }
}


/**
 * @desc Creates a gradient legend on HTML page, defining type of legend and start and end values. Creates the rectangle for legend and appends it to HTML page.
 * @public
 * @param {string} elementId Id of element in which legend will be appended.
 * @param {string} gradientTitle Title for gradient.
 */
GradientLegend.prototype.createGradientLegend = function(elementId, gradientTitle)
{
  try
  {
    /** Set gradient title */
    var span = d3.select("#" + elementId)
      .append("span")
      .attr("id", this.spanElementId)
      .style("padding-right", "20px");
    span._groups[0][0].innerHTML = gradientTitle;
    /** Create SVG element */
    var key = d3.select("#" + elementId)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);
    var legend = key.append("defs")
        .append("svg:linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "100%")
        .attr("y2", "100%")
        .attr("spreadMethod", "pad");
    /** Defining range of gradient from 'light blue' (rgb(220, 255, 255)) to 'dark blue' (rgb(0, 0, 255)) */
    legend.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#dcffff")
      .attr("stop-opacity", 1);
    legend.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#0000ff")
      .attr("stop-opacity", 1);
    /** Creating rectangle */
    key.append("rect")
      .attr("width", this.width-5)
      .attr("height", this.height - 30)
      .style("fill", "url(#gradient)")
      .attr("transform", "translate(0,10)");
    /** Scale original edge weights to normalized edge weights */
    var y = d3.scaleLinear()
      // .range([this.graphInfo.maxDomainValue, this.graphInfo.minDomainValue])
      .range([this.width-6, 0])
      .domain([this.maxDomainValue, this.minDomainValue]);
      // .domain([this.graphInfo.maxDomainValue, this.graphInfo.minDomainValue]);
    /** Define scale ticks */
    var yAxis = d3.axisBottom()
      .scale(y)
      .ticks(this.ticks);
    /** Create and append legend to svg */
    key.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(0,30)")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("axis title");
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in function GradientLegend.createGradientLegend. " + err;
  }
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

				/** Get camera depth */
				cameraPos = scope.object.position.z;
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

	/**
	 * @author diego2337 - https://github.com/diego2337
	 * Adding specific changes to orbitControls.js file to work with threeGraph.
	 */

	/** Pan left */
	$('#panLeft').on('click', function(){
		/* Reset camera to initial position */
		scope.reset();
		/* Apply pan */
		parseInt(bipartiteGraph.firstLayer ) > parseInt(bipartiteGraph.lastLayer) ? panSize = parseInt(bipartiteGraph.firstLayer) : panSize = parseInt(bipartiteGraph.lastLayer);
		pan(panSize*2, 0);
		scope.update();
	});

	/** Pan right */
	$('#panRight').on('click', function(){
		/* Reset camera to initial position */
		scope.reset();
		/* Apply pan */
		parseInt(bipartiteGraph.firstLayer ) > parseInt(bipartiteGraph.lastLayer) ? panSize = parseInt(bipartiteGraph.firstLayer) : panSize = parseInt(bipartiteGraph.lastLayer);
		pan(-panSize*2, 0);
		scope.update();
	});

	/** Reset */
	$('#resetButton').on('click', function(){
		scope.reset();
		scope.object.position.z = document.getElementById("mainSection").clientHeight/4;
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
