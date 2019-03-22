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
       this.renderLayers = { renderFirstLayer: true, renderLastLayer: true };
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
 * Get which independent sets are to be rendered on screen.
 * @public
 * @returns {Object} renderLayers Object containing boolean for rendering both first and second layers.
 */
BipartiteGraph.prototype.getRenderedLayers = function()
{
  return this.renderLayers;
}

/**
 * Set which independent sets are to be rendered on screen.
 * @public
 * @param {Object} renderLayers Object containing boolean for rendering both first and second layers.
 */
BipartiteGraph.prototype.setRenderedLayers = function(renderLayers)
{
  this.renderLayers = renderLayers;
}

/**
 * Renders nodes in the scene.
 * @public
 * @param {Object} graph Object containing .json graph file.
 * @param {Object} scene The scene in which the graph will be built.
 * @param {int} layout Graph layout.
 * @param {Object} firstIndependentSet Independent set where first set of nodes will be rendered.
 * @param {Object} secondIndependentSet Independent set where second set of nodes will be rendered.
 * @param {Object} vertexInfo VertexInfo type object to store properties from vertexes.
 * @param {float} maxNormalizingRange Maximum range to be used when normalizing vertexes.
 * @param {float} minNormalizingRange Minimum range to be used when normalizing vertexes.
 * @param {Array} color Color to be used when rendering a node.
 */
BipartiteGraph.prototype.renderNodes = function(graph, scene, layout, firstIndependentSet, secondIndependentSet, vertexInfo, maxNormalizingRange, minNormalizingRange, color)
{
  /** Create single geometry which will contain all geometries */
  var singleGeometry = new THREE.Geometry();
  /** y represents space between two layers, while theta space between each vertice of each layer */
  var y = -document.getElementById("mainSection").clientHeight/this.distanceBetweenSets;
  var theta = 30;
  /** Define x-axis starting position */
  var pos = (-1 * (parseInt(this.firstLayer) / 2.0));
  /** Fill an array with nodes from first set */
  var setNodes = [];
  for(var i = 0; i < parseInt(this.firstLayer); i++)
  {
    setNodes.push(graph.nodes[i]);
  }
  /** Store properties from vertexes in first layer */
  if(vertexInfo !== undefined) vertexInfo.storeProperties(setNodes[0], 0);
  /** Create an independent set and render its nodes */
  if(this.renderLayers.renderFirstLayer == true) firstIndependentSet.buildSet(this.renderLayers, this.firstLayer, this.lastLayer, singleGeometry, setNodes, graph.links, graph.graphInfo[0].minNodeWeight, graph.graphInfo[0].maxNodeWeight, pos, y, theta, layout, maxNormalizingRange, minNormalizingRange, color);
  /** Readjust x and y-axis values */
  y = y * (-1);
  pos = -1 * Math.floor(parseInt(this.lastLayer) / 2);
  /** Clear array and fill with nodes from second set */
  setNodes = [];
  for(var i = 0; i < parseInt(this.lastLayer); i++)
  {
    setNodes.push(graph.nodes[i+parseInt(this.firstLayer)]);
  }
  /** Store properties from vertexes in second layer */
  if(vertexInfo !== undefined) vertexInfo.storeProperties(setNodes[0], 1);
  /** Create an independent set and render its nodes */
  if(this.renderLayers.renderLastLayer == true) secondIndependentSet.buildSet(this.renderLayers, this.firstLayer, this.lastLayer, singleGeometry, setNodes, graph.links, graph.graphInfo[0].minNodeWeight, graph.graphInfo[0].maxNodeWeight, pos, y, theta, layout, maxNormalizingRange, minNormalizingRange, color);
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
 * @param {Object} vertexInfo VertexInfo type object to store properties from vertexes.
 * @param {float} maxNormalizingRange Maximum range to be used when normalizing vertexes.
 * @param {float} minNormalizingRange Minimum range to be used when normalizing vertexes.
 * @param {Array} color Color to be used when rendering a node.
 */
BipartiteGraph.prototype.renderGraph = function(graph, scene, layout, vertexInfo, maxNormalizingRange, minNormalizingRange, color)
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
    this.renderNodes(graph, scene, layout, firstIndependentSet, secondIndependentSet, vertexInfo, maxNormalizingRange, minNormalizingRange, color);

    /** Build edges */
    // this.renderEdges(graph, scene, layout, firstIndependentSet, secondIndependentSet);

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
  /** Array to store sizes of nodes */
  this.circleSizes = [];
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
 * @param {Object} renderLayers Object containing boolean for rendering both first and second layers.
 * @param {int} firstLayer Number of nodes in first layer.
 * @param {int} lastLayer Number of nodes in last layer.
 * @param {Object} geometry Single geometry which will contain all node geometries, merged.
 * @param {Array} nodes Array of objects containing .json type nodes (id, weight...).
 * @param {Array} links Array of objects containing .json type edges (source, target, weight).
 * @param {float} minNodeWeight Minimum node weight for 'nodes' set.
 * @param {float} maxNodeWeight Maximum node weight for 'nodes' set.
 * @param {int} pos x-axis starting coordinate for nodes.
 * @param {int} y y-axis coordinate for nodes.
 * @param {float} theta Theta value which defines spacing between nodes.
 * @param {int} layout Graph layout.
 * @param {float} maxNormalizingRange Maximum range to be used when normalizing vertexes.
 * @param {float} minNormalizingRange Minimum range to be used when normalizing vertexes.
 * @param {Array} colour Color to be used when rendering a node.
 */
IndependentSet.prototype.buildSet = function(renderLayers, firstLayer, lastLayer, geometry, nodes, links, minNodeWeight, maxNodeWeight, pos, y, theta, layout, maxNormalizingRange, minNormalizingRange, colour)
{
  try
  {
    var independentSetScope = this;
    /** Perform AJAX call to fetch colors server-side */
    var getColors = $.ajax({
      url: 'graph/getColors',
      type: 'POST',
      async: false,
      data: { nodes: nodes },
      xhr: loadGraph
    });
    getColors.done(function(data){
      data = JSON.parse(data);
      // data = data.colors;
      /** Store number of faces before adding nodes */
      var numberOfFaces = geometry.faces.length;
      /** Build nodes */
      /** Creating geometry for nodes */
      var circleGeometry = new THREE.CircleGeometry(1, 32);
      for(var i = 0; i < nodes.length && nodes[i] !== undefined; i++, pos++)
      {
        /** Color vertexes */
        if(data.colors[i] == undefined)
        {
          for(var k = 0; k < circleGeometry.faces.length; k++)
          {
            circleGeometry.faces[k].color.setRGB(colour[0], colour[1], colour[2]);
          }
        }
        else
        {
          /** Calculate proportion for each color space */
          var sum = 0;
          for(var sumI = 0; sumI < data.repeats[i].length; sumI = sumI + 1)
          {
            sum = sum + parseInt(data.repeats[i][sumI]);
          }
          var proportion = parseFloat(32.0 / parseFloat(sum));
          var proportionLengths = [];
          for(var sumI = 0; sumI < data.repeats[i].length; sumI = sumI + 1)
          {
            proportionLengths.push(parseInt(parseFloat(data.repeats[i][sumI])*proportion));
          }
          for(var k = 0, l = 0; k < circleGeometry.faces.length; k++)
          {
            if(k > proportionLengths[l])
            {
              l = l + 1;
              proportionLengths[l] = proportionLengths[l] + proportionLengths[l-1];
            }
            data.colors[i][l] != null ? circleGeometry.faces[k].color.setRGB(data.colors[i][l][0], data.colors[i][l][1], data.colors[i][l][2]) : circleGeometry.faces[k].color.setRGB(colour[0], colour[1], colour[2]);
          }
          // var length = data[i].length;
          // var colorLength = parseInt(circleGeometry.faces.length/length);
          // for(var k = 0, l = 0; k < circleGeometry.faces.length; k++)
          // {
          //   if(k > colorLength)
          //   {
          //     l = l + 1;
          //     colorLength = colorLength + colorLength;
          //   }
          //   data[i][l] != null ? circleGeometry.faces[k].color.setRGB(data[i][l][0], data[i][l][1], data[i][l][2]) : circleGeometry.faces[k].color.setRGB(colour[0], colour[1], colour[2]);
          // }
        }
        var x = pos * theta;
        if(nodes[i].weight == undefined) nodes[i].weight = parseInt(minNodeWeight);
        var circleSize = (maxNormalizingRange - minNormalizingRange) * ( (parseInt(nodes[i].weight) - parseInt(minNodeWeight))/((parseInt(maxNodeWeight)-parseInt(minNodeWeight))+1) ) + minNormalizingRange;
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
          independentSetScope.positions.push({x: y, y: x, z: 0});
          /** Push size to array */
          independentSetScope.circleSizes.push(circleSize);
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
          independentSetScope.positions.push({x: x, y: y, z: 0});
          /** Push size to array */
          independentSetScope.circleSizes.push(circleSize);
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
        geometry.faces[i].neighbors = independentSetScope.findNeighbors(nodes, links, j);
        /** Store vertex position */
        geometry.faces[i].position = independentSetScope.positions[j];
        /** Store circle size */
        geometry.faces[i].size = independentSetScope.circleSizes[j];
        /** Store vertex position */
        // geometry.faces[i].position = independentSetScope.positions[j];
        /** Store which layers are being rendered */
        geometry.faces[i].layers = JSON.stringify(renderLayers);
        /** Store number of vertexes for each layer */
        geometry.faces[i].firstLayer = firstLayer;
        geometry.faces[i].lastLayer = lastLayer;
      }

      /** Properly dispose of object */
      circleGeometry.dispose();
      circleGeometry = null;
    });
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in function IndependentSet.buildSet. " + err;
  }
}

/**
 * @desc Base class for abstraction of all elements in scene. Reponsible for rendering bipartite graph in scene, invoking functions to generate drawings, taking care of clearing and filling HTML page elements and invoking all objects in scene.
 * @author Diego Cintra
 * 1 May 2018
 */

 /** @global Global variables must be declarated for redrawing to happen. */
 var globalRenderer, globalScene;

/**
 * @constructor
 * @param {String} svgId Id to store <svg> id value.
 */
var Layout = function(svgId)
{
  /** @desc Define trigger for saving a graph image in .png format */
  this.capture = false;
  /** @desc Define number of coarsened graphs in current visualization */
  this.numOfLevels = 0;
  /** @desc Define if gradient legend is already present */
  this.gradientLegend = undefined;
  /** @desc Define if communities legend is already present */
  this.communitiesLegend = undefined;
  /** @desc Define standard layout - (2) for horizontal bipartite graph, (3) for vertical bipartite graph */
  this.lay = 2;
  /** @desc Define events object */
  this.eventHandler = undefined;
  /** @desc Define vertexInfo object, to hold vertexes properties */
  this.vertexInfo = new VertexInfo();
  /** @desc - Defines if parent connections of coarsened vertexes will be shown - (0) for false, (1) for true */
  this.parentConnections = 0;
  /** @desc String that defines svg tag id */
  this.svgId = svgId;
  /** @desc Boolean that tells to render only most coarsened bipartite graph */
  this.onlyCoarsest = 1;
}

/**
 * Clear all bipartiteGraph info on HTML page.
 * @public
 * @param {string} numberOfVertices "id" attribute of HTML element indicating number of vertexes to be shown.
 * @param {string} numberOfEdges "id" attribute of HTML element indicating number of edges to be shown.
 * @param {string} nVerticesFirstLayer "id" attribute of HTML element indicating number of verticesw in first layer to be shown.
 * @param {string} nVerticesSecondLayer "id" attribute of HTML element indicating number of verticesw in second layer to be shown.
 */
Layout.prototype.removeGraphInfo = function(numberOfVertices, numberOfEdges, nVerticesFirstLayer, nVerticesSecondLayer)
{
  vueRootInstance.$data.graphInfo.rows = [];
  // document.getElementById(numberOfVertices).innerHTML = "";
  // document.getElementById(numberOfEdges).innerHTML = "";
  // document.getElementById(nVerticesFirstLayer).innerHTML = "";
  // document.getElementById(nVerticesSecondLayer).innerHTML = "";
}

/**
 * Display bipartiteGraph info on HTML page.
 * @public
 * @param {JSON} jason .json file representing bipartiteGraph.
 * @param {string} numberOfVertices "id" attribute of HTML element indicating number of vertexes to be shown.
 * @param {string} numberOfEdges "id" attribute of HTML element indicating number of edges to be shown.
 * @param {string} nVerticesFirstLayer "id" attribute of HTML element indicating number of vertices in first layer to be shown.
 * @param {string} nVerticesSecondLayer "id" attribute of HTML element indicating number of vertices in second layer to be shown.
 */
Layout.prototype.displayGraphInfo = function(jason, numberOfVertices, numberOfEdges, nVerticesFirstLayer, nVerticesSecondLayer)
{
  var vertexes;
  var firstLevel;
  var secondLevel;
  if(jason.graphInfo[0].vlayer !== undefined)
  {
    vertexes = parseInt(jason.graphInfo[0].vlayer.split(" ")[0]) + parseInt(jason.graphInfo[0].vlayer.split(" ")[1]);
    firstLevel = parseInt(jason.graphInfo[0].vlayer.split(" ")[0]);
    secondLevel = parseInt(jason.graphInfo[0].vlayer.split(" ")[1]);
  }
  else
  {
    vertexes = parseInt(jason.graphInfo[0].vertices.split(" ")[0]) + parseInt(jason.graphInfo[0].vertices.split(" ")[1]);
    firstLevel = parseInt(jason.graphInfo[0].vertices.split(" ")[0]);
    secondLevel = parseInt(jason.graphInfo[0].vertices.split(" ")[1]);
  }
  /** Fill tables with appropriate values */
  var values = [];
  /** Add values in following order - 'graph level', 'vertices', 'edges', 'first layer', 'second layer' */
  values.push("n");
  values.push(parseInt(vertexes));
  values.push(parseInt(jason.graphInfo[0].edges));
  values.push(firstLevel);
  values.push(secondLevel);
  vueRootInstance.$data.graphInfo.rows.push(values);
  /** FIXME - deprecated */
  /** Store innerHTML elements in variables for consistency */
  // var numOfVertexes = document.getElementById(numberOfVertices), vertexes;
  // var numOfEdges = document.getElementById(numberOfEdges);
  // var nVerticesFirstLayer = document.getElementById(nVerticesFirstLayer), firstLevel;
  // var nVerticesSecondLayer = document.getElementById(nVerticesSecondLayer), secondLevel;
  // /** Making necessary assignments according to information from graphInfo */
  // if(jason.graphInfo[0].vlayer !== undefined)
  // {
  //   vertexes = parseInt(jason.graphInfo[0].vlayer.split(" ")[0]) + parseInt(jason.graphInfo[0].vlayer.split(" ")[1]);
  //   firstLevel = parseInt(jason.graphInfo[0].vlayer.split(" ")[0]);
  //   secondLevel = parseInt(jason.graphInfo[0].vlayer.split(" ")[1]);
  // }
  // else
  // {
  //   vertexes = parseInt(jason.graphInfo[0].vertices.split(" ")[0]) + parseInt(jason.graphInfo[0].vertices.split(" ")[1]);
  //   firstLevel = parseInt(jason.graphInfo[0].vertices.split(" ")[0]);
  //   secondLevel = parseInt(jason.graphInfo[0].vertices.split(" ")[1]);
  // }
  // /* Display number of vertices, edges, vertexes for first and second level separately */
  // if(numOfVertexes.innerHTML == "")
  // {
  //   numOfVertexes.innerHTML = vertexes;
  //   numOfEdges.innerHTML = parseInt(jason.graphInfo[0].edges);
  //   nVerticesFirstLayer.innerHTML = firstLevel;
  //   nVerticesSecondLayer.innerHTML = secondLevel;
  // }
  // else
  // {
  //   numOfVertexes.innerHTML = numOfVertexes.innerHTML + "/" + vertexes;
  //   numOfEdges.innerHTML = numOfEdges.innerHTML + "/" + parseInt(jason.graphInfo[0].edges);
  //   nVerticesFirstLayer.innerHTML = nVerticesFirstLayer.innerHTML + "/" + firstLevel;
  //   nVerticesSecondLayer.innerHTML = nVerticesSecondLayer.innerHTML + "/" + secondLevel;
  // }
}

/**
 * Find index of object which contains specified value inside an array.
 * @param {(string|int|float)} value Value to be searched in objects.
 * @param {Array} objArray Object array.
 * @returns {int} Index of position or -1 if not found.
 */
function findPos(value, objArray)
{
  return objArray.map(function(e) { return e.id; }).indexOf(value);
}

/**
 * Connect vertexes from previous level to current level, using information stored in nodes.
 * @param {JSON} innerNodes Coarsened nodes.
 * @param {JSON} outerNodes Uncoarsened nodes (from previous levels).
 * @param {int} innerBPLevel Inner bipartite graph level. Necessary to access proper mesh where such bipartite graph was built.
 * @param {int} outerBPLevel Outer bipartite graph level (previous coarsening level). Necessary to access proper mesh where such bipartite graph was built.
 */
Layout.prototype.connectVertexes = function(innerNodes, outerNodes, innerBPLevel, outerBPLevel)
{
  // console.log("innerBPLevel: " + innerBPLevel);
  // console.log("outerBPLevel: " + outerBPLevel);
  /** Fetch meshes */
  var outerMesh;
  parseInt(outerBPLevel) == 0 ? outerMesh = globalScene.getObjectByName("MainMesh", true) : outerMesh = globalScene.getObjectByName("MainMesh" + outerBPLevel.toString(), true);
  var innerMesh;
  parseInt(innerBPLevel) == 0 ? innerMesh = globalScene.getObjectByName("MainMesh", true) : innerMesh = globalScene.getObjectByName("MainMesh" + innerBPLevel.toString(), true);
  /** Iterate through innerNodes to get predecessors */
  var edgeGeometry = new THREE.Geometry();
  for(let i = 0; i < innerNodes['nodes'].length; i++)
  {
    /** Store (array of) predecessor(s) */
    let predecessor = innerNodes['nodes'][i].predecessor;
    let innerIndex = parseInt(innerNodes['nodes'][i].id)*32;
    /** Store position(s) of predecessor(s) */
    predecessor = predecessor.split(",");
    var v1 = new THREE.Vector3(innerMesh.geometry.faces[innerIndex].position.x, innerMesh.geometry.faces[innerIndex].position.y, innerMesh.geometry.faces[innerIndex].position.z);
    for(let j = 0; j < predecessor.length; j++)
    {
      let pos = findPos(predecessor[j], outerNodes['nodes']);
      let outerIndex = (parseInt(outerNodes['nodes'][pos].id))*32;
      var v2 = new THREE.Vector3(outerMesh.geometry.faces[outerIndex].position.x, outerMesh.geometry.faces[outerIndex].position.y, outerMesh.geometry.faces[outerIndex].position.z);
      edgeGeometry.vertices.push(v1);
      edgeGeometry.vertices.push(v2);
    }
  }
  for(let i = 0; i < edgeGeometry.vertices.length; i++)
  {
    edgeGeometry.colors[i] = new THREE.Color(0xFF0000);
    edgeGeometry.colors[i+1] = edgeGeometry.colors[i];
  }
  edgeGeometry.verticesNeedUpdate = true;
  edgeGeometry.colorsNeedUpdate = true;

  /** Create one LineSegments and add it to scene */
  var edgeMaterial = new THREE.LineBasicMaterial({vertexColors:  THREE.VertexColors});
  var lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial, THREE.LinePieces);
  globalScene.add(lineSegments);

  edgeGeometry.dispose();
  edgeGeometry = null;
  edgeMaterial.dispose();
  edgeMaterial = null;
}

/**
 * Create eventHandler object, to associate all document listeners to it.
 * @public
 * @param {Object} camera Camera object from three.js API.
 * @param {string} WebGL "id" attribute of HTML element indicating main section for canvas to be drawn.
 */
Layout.prototype.createEventListener = function(camera, WebGL)
{
  var numOfLevels = this.numOfLevels;
  var lay = this.lay;

  if(this.eventHandler === undefined)
  {
    this.eventHandler = new EventHandler(undefined, "#" + WebGL, this.svgId, this.numOfLevels, "#wordCloudCard");
    var eventHandler = this.eventHandler
    /* Adding event listeners */
    document.addEventListener('resize', function(evt){
      camera.aspect = document.getElementById(WebGL).clientWidth / document.getElementById(WebGL).clientHeight;
      camera.updateProjectionMatrix();
      globalRenderer.setSize(document.getElementById(WebGL).clientWidth, document.getElementById(WebGL).clientHeight);
    }, false);
    document.addEventListener('mousemove', function(evt){eventHandler.mouseMoveEvent(evt, globalRenderer, globalScene);}, false);
    document.addEventListener('dblclick', function(evt){
      eventHandler.mouseDoubleClickEvent(evt, globalRenderer, globalScene, lay);
      // eventHandler.mouseDoubleClickEvent(clicked, evt, bipartiteGraph);
      // !clicked ? clicked = true : clicked = false;
    }, false);
    document.addEventListener('click', function(evt){
      eventHandler.mouseClickEvent(evt, globalRenderer, globalScene, lay);
    }, false);
  }
  else
  {
    /** Update number of levels */
    this.eventHandler.setNLevels(numOfLevels);
  }
}

/**
 * Configure additional three.js API parameters, such as camera, light and controls.
 * @public
 * @param {string} mainSection "id" attribute of HTML element indicating main section containing main canvas.
 * @param {string} WebGL "id" attribute of HTML element indicating main section for canvas to be drawn.
 * @param {int} canvasWidth Width of canvas element in HTML page.
 * @param {int} canvasHeight Height of canvas element in HTML page.
 */
Layout.prototype.configCLC = function(mainSection, WebGL, canvasWidth, canvasHeight)
{
  /* Create the camera and associate it with the scene */
  var camera = undefined;
  if(camera !== undefined) delete camera;
  camera = new THREE.PerspectiveCamera(120, canvasWidth / canvasHeight, 1, 2000);
  camera.position.set(0, 0, document.getElementById(mainSection).clientHeight/4);
  camera.lookAt(globalScene.position);
  camera.name = "camera";
  globalScene.add(camera);

  /* Create simple directional light */
  var light = undefined;
  if(light !== undefined) delete light;
  light = new THREE.DirectionalLight();
  light.position.set(0, 0, 10);
  globalScene.add(light);

  /* Using orbitControls for moving */
  if(controls !== undefined) delete controls;
  var controls = new THREE.OrbitControls(camera, globalRenderer.domElement);

  /* Setting up params */
  controls.minDistance = 1;
  controls.maxDistance = 500;
  controls.zoomSpeed = 1.5;
  controls.target.set(0, 0, 0);
  controls.enableRotate = false;
  controls.enableKeys = false;

  controls.mouseButtons = { PAN: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, ORBIT: THREE.MOUSE.RIGHT };

  /** Creating event listener */
  this.createEventListener(camera, WebGL);
}

/**
 * Dispose of a three.js API element.
 * @param {Object} node Any element from three.js API.
 */
Layout.prototype.disposeNode = function(node)
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

/**
 * Method to dispose of all three.js generated elements and children.
 * @param {Object} node Any element from three.js API.
 * @param {function} callback Callback function to be invoked to dispose of element and its children.
 */
Layout.prototype.disposeHierarchy = function(node, callback)
{
    for (var i = node.children.length - 1; i >= 0; i--)
    {
        var child = node.children[i];
        this.disposeHierarchy (child, callback);
        callback (child);
    }
}

/**
 * Initialize renderer and scene for three.js API, configuring their aspects.
 * @public
 * @param {string} mainSection "id" attribute of HTML element indicating main section containing main canvas.
 * @param {string} WebGL "id" attribute of HTML element indicating main section for canvas to be drawn.
 */
Layout.prototype.configAPIParams = function(mainSection, WebGL)
{
  /* Get the size of the inner window (content area) to create a full size renderer */
  canvasWidth = 1200;
  canvasHeight = 900;
  // canvasWidth = (document.getElementById(mainSection).clientWidth);
  // canvasHeight = (document.getElementById(mainSection).clientHeight);
  if(globalRenderer == undefined)
  {
      /* Create a new WebGL renderer */
      globalRenderer = new THREE.WebGLRenderer({antialias:true});
      /* Set the background color of the renderer to black, with full opacity */
      globalRenderer.setClearColor("rgb(255, 255, 255)", 1);
      /* Set the renderers size to the content area size */
      globalRenderer.setSize(canvasWidth, canvasHeight);
  }
  else
  {
      globalRenderer.setRenderTarget(null);
      globalRenderer.clear();
  }

  /* Create scene */
  if(globalScene !== undefined)
  {
    this.disposeHierarchy(globalScene, this.disposeNode);
    for(var i = globalScene.children.length - 1; i >= 0; i--)
    {
      globalScene.remove(globalScene.children[i]);
    }
    delete globalScene;
  }
  else
  {
    globalScene = new THREE.Scene();
  }

  /** Get DIV element from HTML document by its ID and append renderers' DOM object to it */
  document.getElementById(WebGL).appendChild(globalRenderer.domElement);

  /** Configure camera, light and controls */
  this.configCLC(mainSection, WebGL, canvasWidth, canvasHeight);
}

/**
 * Check if any of the layers from less coarsened and most coarsened graphs are equal.
 * @public
 * @param {Object} coarsenedGraph Most coarsened bipartite graph.
 * @param {Object} lessCoarsenedGraph Less coarsened bipartite graph.
 * @return {int} (1) if graphs have equal layers, (0) otherwise.
 */
Layout.prototype.hasEqualLayers = function(coarsenedGraph, lessCoarsenedGraph)
{
  // console.log("coarsenedGraph:");
  // console.log(coarsenedGraph);
  // console.log("lessCoarsenedGraph:");
  // console.log(lessCoarsenedGraph);
  var equalLayer = { renderFirstLayer: true, renderSecondLayer: true };
  parseInt(coarsenedGraph.firstLayer) == parseInt(lessCoarsenedGraph.firstLayer) ? equalLayer.renderFirstLayer = false : equalLayer.renderFirstLayer = true;
  parseInt(coarsenedGraph.lastLayer) == parseInt(lessCoarsenedGraph.lastLayer) ? equalLayer.renderLastLayer = false : equalLayer.renderLastLayer = true;
  return equalLayer;
}

/**
 * Compare two objects.
 * @public
 * @param {Object} item1 Object to be compared.
 * @param {Object} item2 Object to be compared.
 * @returns {Boolean} Returns false if objects are different, true otherwise.
 */
Layout.prototype.compare = function (item1, item2) {

  // Get the object type
  var itemType = Object.prototype.toString.call(item1);

  // If an object or array, compare recursively
  if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
    if (!this.isEqual(item1, item2)) return false;
  }

  // Otherwise, do a simple comparison
  else {

    // If the two items are not the same type, return false
    if (itemType !== Object.prototype.toString.call(item2)) return false;

    // Else if it's a function, convert to a string and compare
    // Otherwise, just compare
    if (itemType === '[object Function]') {
      if (item1.toString() !== item2.toString()) return false;
    } else {
      if (item1 !== item2) return false;
    }

  }
  // Returns true
  return true;
};

/**
 * Helper function to check if both arrays have the same values, from https://gomakethings.com/check-if-two-arrays-or-objects-are-equal-with-javascript/
 * @param {(Object|Array)} value First array or object to be compared.
 * @param {(Object|Array)} other Second array or object to be compared.
 * @returns {Boolean} true if arrays or objects are equal, false otherwise
 */
Layout.prototype.isEqual = function (value, other) {

	// Get the value type
	var type = Object.prototype.toString.call(value);

	// If the two objects are not the same type, return false
	if (type !== Object.prototype.toString.call(other)) return false;

	// If items are not an object or array, return false
	if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

	// Compare the length of the length of the two items
	var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
	var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
	if (valueLen !== otherLen) return false;

	// Compare properties
	if (type === '[object Array]') {
		for (var i = 0; i < valueLen; i++) {
			if (this.compare(value[i], other[i]) === false) return false;
		}
	} else {
		for (var key in value) {
			if (value.hasOwnProperty(key)) {
				if (this.compare(value[key], other[key]) === false) return false;
			}
		}
	}

	// If nothing failed, return true
	return true;

};

/**
 * Sort nodes from previous uncoarsened bipartite graph according to current bipartite graph's super vertexes.
 * @public
 * @param {int} index Index of current coarsening level.
 * @param {Object} renderLayers Object containing boolean for rendering both first and second layers.
 * @param {int} firstLayerNodes Number of nodes from first layer.
 * @param {int} secondLayerNodes Number of nodes from second layer.
 * @param {Object} currentBP Most coarsened bipartite graph.
 * @param {Object} previousBP Previous uncoarsened bipartite graph.
 * @returns {Object} Nodes in "sorted" order.
 */
Layout.prototype.sortSVNodes = function(index, renderLayers, firstLayerNodes, secondLayerNodes, currentBP, previousBP)
{
  var start = 0, end = currentBP.nodes.length, newNodes = [], newNodesIndexes = [];
  // if(renderLayers.renderFirstLayer == false) start = parseInt(firstLayerNodes);
  // if(renderLayers.renderLastLayer == false) end = parseInt(secondLayerNodes);
  // console.log("renderLayers:");
  // console.log(renderLayers);
  // console.log("start, end: " + parseInt(firstLayerNodes) + " " + parseInt(secondLayerNodes));
  // for(let i = 0; i < currentBP.nodes.length; i++)
  for(let i = start; i < end; i++)
  {
    // if(currentBP.nodes[i].predecessor !== undefined)
    if(currentBP.nodes[i] !== undefined)
    {
      // console.log("i: " + i);
      // console.log("currentBP.nodes[i]:");
      // console.log(currentBP.nodes[i]);
      /** Breaks values from "predecessor" value, e.g. "predecessor": "1307,1308" */
      var predecessors = currentBP.nodes[i].predecessor.split(",");
      for(let j = 0; j < predecessors.length; j++)
      {
        newNodes.push(previousBP.nodes[parseInt(predecessors[j])]);
        newNodesIndexes.push(parseInt(predecessors[j]));
        // var aux = previousBP.nodes[j];
        // previousBP.nodes[j] = previousBP.nodes[parseInt(predecessors[j])];
        // previousBP.nodes[parseInt(predecessors[j])] = aux;
        /** Write "sorted" nodes server-side */
        // $.ajax({
        //   url: '/writeSorted',
        //   type: 'POST',
        //   data: { firstWrite: i == 0 ? true : false, idx: index, pred: i == currentBP.nodes.length -1 ? predecessors[j] : predecessors[j] + ' '},
        //   xhr: loadGraph
        // });
      }
    }
  }
  $.ajax({
    url: '/system/writeSorted',
    type: 'POST',
    data: {idx: index, nodes: newNodesIndexes},
    xhr: loadGraph
  });
  return newNodes;
}

/**
 * Build and render previous uncoarsened bipartite graphs.
 * @public
 * @param {Object} bipartiteGraph Most coarsened bipartite graph, already rendered.
 * @param {int} lay Graph layout. Default is 2 (bipartite horizontal).
 * @param {JSON} jason .json file representing bipartiteGraph.
 * @param {string} graphName Current coarsened graph name.
 * @param {int} numOfLevels Current number of coarsened levels.
 * @param {string} numberOfVertices "id" attribute of HTML element indicating number of vertexes to be shown.
 * @param {string} numberOfEdges "id" attribute of HTML element indicating number of edges to be shown.
 * @param {string} nVerticesFirstLayer "id" attribute of HTML element indicating number of verticesw in first layer to be shown.
 * @param {string} nVerticesSecondLayer "id" attribute of HTML element indicating number of verticesw in second layer to be shown.
 */
Layout.prototype.buildAndRenderCoarsened = function(bipartiteGraph, lay, jason, graphName, numOfLevels, numberOfVertices, numberOfEdges, nVerticesFirstLayer, nVerticesSecondLayer)
{
  var bipartiteGraphs = [];
  var layout = this;
  /** Parsing strings to numbers */
  numOfLevels = numOfLevels.map(Number);
  // for(let i = parseInt(numOfLevels); i >= 0; i = i - 1)
  for(let i = parseInt(numOfLevels[0]), j = parseInt(numOfLevels[1]); i >= 0 && j >= 0; )
  {
    var gName = graphName.split(".")[0];
    gName = gName.split("Coarsened")[0] + "Coarsened" + gName.split("Coarsened")[1].split("n")[0];
    // gName = gName.substring(0, gName.length-2);
    // i == 0 ? gName = gName.substring(0, gName.lastIndexOf('Coarsened')) + ".json" : gName = gName + "n" + (i).toString() + ".json";
    (i == 0 && j == 0) ? gName = gName.substring(0, gName.lastIndexOf('Coarsened')) + ".json" : gName = gName + "nl" + (i).toString() + "nr" + (j).toString() + ".json";
    if(gName !== ".json")
    {
      $.ajax({
        async: false,
        url: '/graph/getLevels',
        type: 'POST',
        data: gName,
        processData: false,
        contentType: false,
        success: function(data){
          /** Store JSON graph in array */
          bipartiteGraphs.push(JSON.parse(JSON.parse(data).graph));
          layout.displayGraphInfo(bipartiteGraphs[bipartiteGraphs.length-1], numberOfVertices, numberOfEdges, nVerticesFirstLayer, nVerticesSecondLayer);
        },
        xhr: loadGraph
      });
    }
    else
    {
      layout.displayGraphInfo(jason, numberOfVertices, numberOfEdges, nVerticesFirstLayer, nVerticesSecondLayer);
    }
    /** If both levels have equal values, decrement them; else decrement maximum value */
    if(i != j)
    {
      i == Math.max(i, j) ? i = i - 1 : j = j - 1;
    }
    else
    {
      i = i - 1;
      j = j - 1;
    }
  }
  /** Create variable to hold graph size, to be used for ordering */
  for(let i = 0; i < bipartiteGraphs.length; i++)
  {
    if(bipartiteGraphs[i].graphInfo[0].vlayer !== undefined)
    {
      bipartiteGraphs[i].graphInfo[0].graphSize = parseInt(bipartiteGraphs[i].graphInfo[0].vlayer.split(" ")[0]) + parseInt(bipartiteGraphs[i].graphInfo[0].vlayer.split(" ")[1]);
    }
    else if(bipartiteGraphs[i].graphInfo[0].vertices !== undefined)
    {
      bipartiteGraphs[i].graphInfo[0].graphSize = parseInt(bipartiteGraphs[i].graphInfo[0].vertices.split(" ")[0]) + parseInt(bipartiteGraphs[i].graphInfo[0].vertices.split(" ")[1]);
    }
  }
  /** Sort array */
  bipartiteGraphs.sort(function(a, b){
    // if((a.graphInfo[0].vlayer !== undefined && parseInt(a.graphInfo[0].vlayer.split(" ")[0]) + parseInt(a.graphInfo[0].vlayer.split(" ")[1]) < parseInt(b.graphInfo[0].vlayer.split(" ")[0]) + parseInt(b.graphInfo[0].vlayer.split(" ")[1])) || (a.graphInfo[0].vertices !== undefined && parseInt(a.graphInfo[0].vertices.split(" ")[0]) + parseInt(a.graphInfo[0].vertices.split(" ")[1]) < parseInt(b.graphInfo[0].vertices.split(" ")[0]) + parseInt(b.graphInfo[0].vertices.split(" ")[1])))
    if(a.graphInfo[0].graphSize < b.graphInfo[0].graphSize)
    {
      return -1;
    }
    // else if((a.graphInfo[0].vlayer !== undefined && parseInt(a.graphInfo[0].vlayer.split(" ")[0]) + parseInt(a.graphInfo[0].vlayer.split(" ")[1]) > parseInt(b.graphInfo[0].vlayer.split(" ")[0]) + parseInt(b.graphInfo[0].vlayer.split(" ")[1])) || (a.graphInfo[0].vertices !== undefined && parseInt(a.graphInfo[0].vertices.split(" ")[0]) + parseInt(a.graphInfo[0].vertices.split(" ")[1]) > parseInt(b.graphInfo[0].vertices.split(" ")[0]) + parseInt(b.graphInfo[0].vertices.split(" ")[1])))
    else if(a.graphInfo[0].graphSize > b.graphInfo[0].graphSize)
    {
      return 1;
    }
    else
    {
      return 0;
    }
    // if(a.graphInfo[0].graphSize < b.graphInfo[0].graphSize) return -1;
    // else if(a.graphInfo[0].graphSize > b.graphInfo[0].graphSize) return 1;
    // else return 0;
  });
  /** Render previous uncoarsened graphs */
  // for(let i = bipartiteGraphs.length-1; i >= 0; i = i - 1)
  for(let i = 1, j = bipartiteGraphs.length*2.0; i < bipartiteGraphs.length; i = i + 1)
  {
    var coarsenedBipartiteGraph;
    coarsenedBipartiteGraph = new BipartiteGraph(bipartiteGraphs[i], bipartiteGraph.distanceBetweenSets - (i+1), (i).toString());
    coarsenedBipartiteGraph.setRenderedLayers(this.hasEqualLayers({ firstLayer: bipartiteGraph.firstLayer, lastLayer: bipartiteGraph.lastLayer }, { firstLayer: coarsenedBipartiteGraph.firstLayer, lastLayer: coarsenedBipartiteGraph.lastLayer }));
    /** Sort nodes according to super-vertexes */
    if(i == 0)
    {
      bipartiteGraphs[i].nodes = this.sortSVNodes(i, coarsenedBipartiteGraph.getRenderedLayers(), parseInt(coarsenedBipartiteGraph.firstLayer), parseInt(coarsenedBipartiteGraph.lastLayer), jason, bipartiteGraphs[i]);
    }
    else
    {
      bipartiteGraphs[i].nodes = this.sortSVNodes(i, coarsenedBipartiteGraph.getRenderedLayers(), parseInt(coarsenedBipartiteGraph.firstLayer), parseInt(coarsenedBipartiteGraph.lastLayer), bipartiteGraphs[i-1], bipartiteGraphs[i]);
    }
    // if(i != 0)
    // {
    //   bipartiteGraphs[i].nodes = this.sortSVNodes(i, coarsenedBipartiteGraph.getRenderedLayers(), parseInt(coarsenedBipartiteGraph.firstLayer), parseInt(coarsenedBipartiteGraph.lastLayer), bipartiteGraphs[i-1], bipartiteGraphs[i]);
    // }
    /** Render nodes */
    coarsenedBipartiteGraph.renderNodes(bipartiteGraphs[i], globalScene, lay, new IndependentSet(), new IndependentSet(), undefined, j, 2.0, Array(0.8, 0.8, 0.8));
    // coarsenedBipartiteGraph.renderNodes(bipartiteGraphs[i], globalScene, lay, new IndependentSet(), new IndependentSet(), undefined, j, j-2.0);
    // i+1 == bipartiteGraphs.length ? coarsenedBipartiteGraph.renderNodes(bipartiteGraphs[i], globalScene, lay, new IndependentSet(), new IndependentSet(), undefined, j, 2.0, Array(0.0, 0.0, 0.0)) : coarsenedBipartiteGraph.renderNodes(bipartiteGraphs[i], globalScene, lay, new IndependentSet(), new IndependentSet(), undefined, j, 2.0, Array(0.8, 0.8, 0.8));
    /** Connect super vertexes */
    if(i < bipartiteGraphs.length-1)
    {
      /** Only draw if allowed */
      if(this.parentConnections == 1) this.connectVertexes(bipartiteGraphs[i], bipartiteGraphs[i+1], i, i+1);
    }
    if(j-2.0 >= 0.0000)
    {
      j = j - 2.0;
    }
  }
}

/**
 * Render bipartite graph and its previous uncoarsened forms.
 * @public
 * @param {string} data String of graph (or graphs) to be parsed into JSON notation and rendered.
 * @param {int} layout Graph layout. Default is 2 (bipartite horizontal).
 * @param {string} numberOfVertices "id" attribute of HTML element indicating number of vertexes to be shown.
 * @param {string} numberOfEdges "id" attribute of HTML element indicating number of edges to be shown.
 * @param {string} nVerticesFirstLayer "id" attribute of HTML element indicating number of vertices in first layer to be shown.
 * @param {string} nVerticesSecondLayer "id" attribute of HTML element indicating number of vertices in second layer to be shown.
 * @param {string} mainSectionID "id" attribute of HTML element indicating main section containing main canvas.
 * @param {string} WebGLID "id" attribute of HTML element indicating main section for canvas to be drawn.
 */
Layout.prototype.build = function(data, layout, numberOfVertices, numberOfEdges, nVerticesFirstLayer, nVerticesSecondLayer, mainSectionID, WebGLID)
{
  /** Check and treat incoming response */
  var data = JSON.parse(data);
  /** Assign values to variables */
  var graphName = data.graphName;
  var numOfLevels = data.nLevels;
  /** Number of levels is now an array */
  this.numOfLevels = Math.max(...numOfLevels);
  var firstSet = data.firstSet;
  var secondSet = data.secondSet;
  this.onlyCoarsest = data.onlyCoarsest !== undefined ? data.onlyCoarsest : this.onlyCoarsest;
  var data = data.graph;
  var lay = ecmaStandard(layout, 2);
  this.lay = lay;
  var nVertexes = ecmaStandard(numberOfVertices, "numberOfVertices");
  var nEdges = ecmaStandard(numberOfEdges, "numberOfEdges");
  var nVertexesFirstLayer = ecmaStandard(nVerticesFirstLayer, "nVerticesFirstLayer");
  var nVertexesSecondLayer = ecmaStandard(nVerticesSecondLayer, "nVerticesSecondLayer");
  var mainSection = ecmaStandard(mainSectionID, "mainSection");
  var WebGL = ecmaStandard(WebGLID, "WebGL");
  var bipartiteGraph;
  /** Convert string to JSON */
  var jason = JSON.parse(data);

  /** Remove any information from graphs */
  this.removeGraphInfo(nVertexes, nEdges, nVertexesFirstLayer, nVertexesSecondLayer);

  /** Instantiate renderer, scene, camera and lights, and configure additional parameters */
  this.configAPIParams(mainSection, WebGL);

  // if(bipartiteGraph !== undefined) delete bipartiteGraph;
  bipartiteGraph = new BipartiteGraph(jason, 8, "");

  /* Render bipartiteGraph */
  // bipartiteGraph.renderGraph(jason, globalScene, lay, this.vertexInfo, (parseInt(Math.max(...numOfLevels))+2)*2.0, ((parseInt(Math.max(...numOfLevels))+2)*2.0)-2.0);
  bipartiteGraph.renderGraph(jason, globalScene, lay, this.vertexInfo, (parseInt(Math.max(...numOfLevels))+2)*2.0, 2.0, Array(0.0, 0.0, 0.0));

  /** Build and render bipartite graphs from previous levels of coarsening */
  if(parseInt(this.onlyCoarsest) == 0)
  {
    vueRootInstance.$data.graphInfo.rows = [];
    this.buildAndRenderCoarsened(bipartiteGraph, lay, jason, graphName, numOfLevels, nVertexes, nEdges, nVertexesFirstLayer, nVertexesSecondLayer);
  }
  else
  {
    this.displayGraphInfo(jason);
  }

  delete jason;

  /** Create edge weights gradient legend */
  if(this.gradientLegend !== undefined)
  {
      this.gradientLegend.clear();
      delete this.gradientLegend;
  }
  /** Use minimum edge weight and maximum edge weight as domain values */
  this.gradientLegend = new GradientLegend(bipartiteGraph.linearScale, bipartiteGraph.graphInfo.minEdgeWeight, bipartiteGraph.graphInfo.maxEdgeWeight, 300, 50, 5);
  this.gradientLegend.createGradientLegend("gradientScale", "Edge weights:");

  /** Create communities legend */
  if(this.communitiesLegend != undefined)
  {
    this.communitiesLegend.clear();
    delete this.communitiesLegend;
  }

  var layScope = this;
  /** To create object, check if "colors.json" exists and send its information to constructor; otherwise just send 'No attribute' and  '[0.0, 0.0, 0.0]' as color */
  $.ajax({
    url: '/graph/getColorFile',
    type: 'POST',
    /** FIXME - NEVER EVER EVER EVEEEEEEEEEEEEEEEER <b>EVEEEEEEER</b> use async! */
    async: false,
    success: function(data) {
      data = JSON.parse(data);
      /** Get array of values - from https://stackoverflow.com/questions/7306669/how-to-get-all-properties-values-of-a-javascript-object-without-knowing-the-key/16643074#16643074 */
      var vals = Object.keys(data).map(function (key) {
          return data[key];
      });
      layScope.communitiesLegend = new ScaleLegend(Object.keys(data), vals, Object.keys(data).length*50);
      layScope.communitiesLegend.createScaleLegend("communityLegend", "Community values:");
      animate();
    },
    xhr: loadGraph
  });
}

/**
 * @desc Base class for vertex info. Responsible for fetching and storing vertex info from .json file.
 * @author Diego Cintra
 * 25 May 2018
 */

/**
 * @constructor
 */
var VertexInfo = function()
{
  /** Create an empty array of properties for first and second layer */
  this.propertiesFirstLayer = [];
  this.propertiesSecondLayer = [];
}

// /**
//  * Getter for properties.
//  * @public
//  * @returns {Array} Properties property from vertexInfo.
//  */
// vertexInfo.prototype.getProperties = function()
// {
//   return this.propertiesFirstLayer;
// }
//
// /**
//  * Setter for raycaster.
//  * @public
//  * @param {Array} props Array of properties.
//  */
// vertexInfo.prototype.setProperties = function(props)
// {
//   this.propertiesFirstLayer = props;
// }

/**
 * @desc Parse a string into JSON object, and store its keys in an array.
 * @param {String} props Properties.
 * @param {int} layer Used to identify from which layer "props" is being passed from - (0) from first layer, (1) from second layer.
 */
VertexInfo.prototype.storeProperties = function(props, layer)
{
  for(key in props)
  {
    layer == 0 ? this.propertiesFirstLayer.push(key.trim()) : this.propertiesSecondLayer.push(key.trim());
  }
}

/**
 * @desc Concatenates arrays to display.
 */
VertexInfo.prototype.getProps = function()
{
  return this.propertiesFirstLayer.concat(this.propertiesSecondLayer);
}

// /** Global variables */
// var bipartiteGraph, gradientLegend, renderer, graph, scene, camera, light, controls, eventHandler, layout = 2, capture = false, clicked = {wasClicked: false}, graphName, numOfLevels = 0, firstSet, secondSet, bipartiteGraphs = [];
// var cameraPos = document.getElementById("mainSection").clientHeight/4;
// // var vueTableHeader, vueTableRows;
// var vueTableHeader = new Vue({
//   el: '#dynamicTableHeaders',
//   data: {
//     headers: ""
//   }
// });
// var vueTableRows = new Vue({
//   el: '#dynamicTableRows',
//   data: {
//     rows: ""
//   }
// });
//
// /**
//  * Clear all bipartiteGraph info on HTML page.
//  * @public
//  */
// function removeGraphInfo()
// {
//   document.getElementById("numberOfVertices").innerHTML = "";
//   document.getElementById("numberOfEdges").innerHTML = "";
//   document.getElementById("nVerticesFirstLayer").innerHTML = "";
//   document.getElementById("nVerticesSecondLayer").innerHTML = "";
// }
//
// /**
//  * Display bipartiteGraph info on HTML page.
//  * @public
//  * @param {JSON} jason .json file representing bipartiteGraph.
//  */
// function displayGraphInfo(jason)
// {
//   /** Store innerHTML elements in variables for consistency */
//   var numOfVertexes = document.getElementById("numberOfVertices"), vertexes;
//   var numOfEdges = document.getElementById("numberOfEdges");
//   var nVerticesFirstLayer = document.getElementById("nVerticesFirstLayer"), firstLevel;
//   var nVerticesSecondLayer = document.getElementById("nVerticesSecondLayer"), secondLevel;
//   /** Making necessary assignments according to information from graphInfo */
//   if(jason.graphInfo[0].vlayer !== undefined)
//   {
//     vertexes = parseInt(jason.graphInfo[0].vlayer.split(" ")[0]) + parseInt(jason.graphInfo[0].vlayer.split(" ")[1]);
//     firstLevel = parseInt(jason.graphInfo[0].vlayer.split(" ")[0]);
//     secondLevel = parseInt(jason.graphInfo[0].vlayer.split(" ")[1]);
//   }
//   else
//   {
//     vertexes = parseInt(jason.graphInfo[0].vertices.split(" ")[0]) + parseInt(jason.graphInfo[0].vertices.split(" ")[1]);
//     firstLevel = parseInt(jason.graphInfo[0].vertices.split(" ")[0]);
//     secondLevel = parseInt(jason.graphInfo[0].vertices.split(" ")[1]);
//   }
//   /* Display number of vertices, edges, vertexes for first and second level separately */
//   if(numOfVertexes.innerHTML == "")
//   {
//     numOfVertexes.innerHTML = vertexes;
//     numOfEdges.innerHTML = parseInt(jason.graphInfo[0].edges);
//     nVerticesFirstLayer.innerHTML = firstLevel;
//     nVerticesSecondLayer.innerHTML = secondLevel;
//   }
//   else
//   {
//     numOfVertexes.innerHTML = numOfVertexes.innerHTML + "/" + vertexes;
//     numOfEdges.innerHTML = numOfEdges.innerHTML + "/" + parseInt(jason.graphInfo[0].edges);
//     nVerticesFirstLayer.innerHTML = nVerticesFirstLayer.innerHTML + "/" + firstLevel;
//     nVerticesSecondLayer.innerHTML = nVerticesSecondLayer.innerHTML + "/" + secondLevel;
//   }
// }
//
// function disposeNode (node)
// {
//     if (node instanceof THREE.Mesh)
//     {
//         if (node.geometry)
//         {
//             node.geometry.dispose();
//             node.geometry = null;
//         }
//
//         if (node.material)
//         {
//             if (node.material instanceof THREE.MeshFaceMaterial)
//             {
//                 $.each (node.material.materials, function (idx, mtrl)
//                 {
//                     if (mtrl.map)           mtrl.map.dispose(), mtrl.map = null;
//                     if (mtrl.lightMap)      mtrl.lightMap.dispose(), mtrl.lightMap = null;
//                     if (mtrl.bumpMap)       mtrl.bumpMap.dispose(), mtrl.bumpMap = null;
//                     if (mtrl.normalMap)     mtrl.normalMap.dispose(), mtrl.normalMap = null;
//                     if (mtrl.specularMap)   mtrl.specularMap.dispose(), mtrl.specularMap = null;
//                     if (mtrl.envMap)        mtrl.envMap.dispose(), mtrl.envMap = null;
//
//                     mtrl.dispose();    // disposes any programs associated with the material
//                     mtrl = null;
//                 });
//             }
//             else
//             {
//                 if (node.material.map)          node.material.map.dispose(), node.material.map = null;
//                 if (node.material.lightMap)     node.material.lightMap.dispose(), node.material.lightMap = null;
//                 if (node.material.bumpMap)      node.material.bumpMap.dispose(), node.material.bumpMap = null;
//                 if (node.material.normalMap)    node.material.normalMap.dispose(), node.material.normalMap = null;
//                 if (node.material.specularMap)  node.material.specularMap.dispose(), node.material.specularMap = null;
//                 if (node.material.envMap)       node.material.envMap.dispose(), node.material.envMap = null;
//
//                 node.material.dispose();   // disposes any programs associated with the material
//                 node.material = null;
//             }
//         }
//
//         node = null;
//     }
// }   // disposeNode
//
// function disposeHierarchy (node, callback)
// {
//     for (var i = node.children.length - 1; i >= 0; i--)
//     {
//         var child = node.children[i];
//         disposeHierarchy (child, callback);
//         callback (child);
//     }
// }
//
// /**
//  * Connect vertexes from previous level to current level, according to .cluster file.
//  * @param {Array} clusters .cluster file grouped as an array.
//  * @param {Object} scene Scene to get meshes.
//  * @param {int} outerBPLevel Outer bipartite graph level (previous coarsening level). Necessary to access proper mesh where such bipartite graph was built.
//  * @param {int} outerBPLevel Inner bipartite graph level. Necessary to access proper mesh where such bipartite graph was built.
//  */
// function connectLevels(clusters, scene, outerBPLevel, innerBPLevel)
// {
//   /** Read char by char, storing numbers in an array */
//   var clusterVertexes = clusters.toString().split("\n");
//   /** Get specific meshes for each coarsened level */
//   var outerMesh;
//   parseInt(outerBPLevel) == 0 ? outerMesh = scene.getObjectByName("MainMesh", true) : outerMesh = scene.getObjectByName("MainMesh" + outerBPLevel.toString(), true);
//   var innerMesh;
//   parseInt(innerBPLevel) == 0 ? innerMesh = scene.getObjectByName("MainMesh", true) : innerMesh = scene.getObjectByName("MainMesh" + innerBPLevel.toString(), true);
//   /** Iterate through clusterVertexes array, constructing edges between layers */
//   var edgeGeometry = new THREE.Geometry();
//   for(let i = 0, k = 0; i < innerMesh.geometry.faces.length && k < clusterVertexes.length; i = i + 32, k = k + 1)
//   {
//     var v1 = new THREE.Vector3(innerMesh.geometry.faces[i].position.x, innerMesh.geometry.faces[i].position.y, innerMesh.geometry.faces[i].position.z);
//     var previousVertexes = clusterVertexes[k].split(" ");
//     for(let j = 0; j < previousVertexes.length && outerMesh.geometry.faces[parseInt(previousVertexes[j])*32] !== undefined; j++)
//     {
//       // console.log("outerMesh:");
//       // console.log(outerMesh.geometry.faces.length);
//       // console.log("innerMesh:");
//       // console.log(innerMesh.geometry.faces.length);
//       // console.log("parseInt(previousVertexes[j])*32");
//       // console.log(outerMesh.geometry.faces[parseInt(previousVertexes[j])*32]);
//       var v2 = new THREE.Vector3(outerMesh.geometry.faces[parseInt(previousVertexes[j])*32].position.x, outerMesh.geometry.faces[parseInt(previousVertexes[j])*32].position.y, outerMesh.geometry.faces[parseInt(previousVertexes[j])*32].position.z);
//       edgeGeometry.vertices.push(v1);
//       edgeGeometry.vertices.push(v2);
//     }
//   }
//   for(let i = 0; i < edgeGeometry.vertices.length; i++)
//   {
//     edgeGeometry.colors[i] = new THREE.Color(0xFF0000);
//     edgeGeometry.colors[i+1] = edgeGeometry.colors[i];
//   }
//   edgeGeometry.verticesNeedUpdate = true;
//   edgeGeometry.colorsNeedUpdate = true;
//
//   /** Create one LineSegments and add it to scene */
//   var edgeMaterial = new THREE.LineBasicMaterial({vertexColors:  THREE.VertexColors});
//   var lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial, THREE.LinePieces);
//   scene.add(lineSegments);
//
//   edgeGeometry.dispose();
//   edgeGeometry = null;
//   edgeMaterial.dispose();
//   edgeMaterial = null;
//   // console.log("Hi, I'm a newborn function yet to be implemented :3");
//   // console.log("outerBPLevel:");
//   // console.log(outerBPLevel);
//   // console.log("outerMesh:");
//   // console.log(outerMesh);
//   // console.log("innerBPLevel:");
//   // console.log(innerBPLevel);
//   // console.log("innerMesh:");
//   // console.log(innerMesh);
// }
//
// /**
//  * Find index of object which contains specified value inside an array.
//  * @param {(string|int|float)} value Value to be searched in objects.
//  * @param {Array} objArray Object array.
//  * @returns {int} Index of position or -1 if not found.
//  */
// function findPos(value, objArray)
// {
//   return objArray.map(function(e) { return e.id; }).indexOf(value);
// }
//
// /**
//  * Connect vertexes from previous level to current level, using information stored in nodes.
//  * @param {JSON} innerNodes Coarsened nodes.
//  * @param {JSON} outerNodes Uncoarsened nodes (from previous levels).
//  * @param {int} innerBPLevel Inner bipartite graph level. Necessary to access proper mesh where such bipartite graph was built.
//  * @param {int} outerBPLevel Outer bipartite graph level (previous coarsening level). Necessary to access proper mesh where such bipartite graph was built.
//  */
// function connectVertexes(innerNodes, outerNodes, innerBPLevel, outerBPLevel)
// {
//   // console.log("innerBPLevel: " + innerBPLevel);
//   // console.log("outerBPLevel: " + outerBPLevel);
//   /** Fetch meshes */
//   var outerMesh;
//   parseInt(outerBPLevel) == 0 ? outerMesh = scene.getObjectByName("MainMesh", true) : outerMesh = scene.getObjectByName("MainMesh" + outerBPLevel.toString(), true);
//   var innerMesh;
//   parseInt(innerBPLevel) == 0 ? innerMesh = scene.getObjectByName("MainMesh", true) : innerMesh = scene.getObjectByName("MainMesh" + innerBPLevel.toString(), true);
//   /** Iterate through innerNodes to get predecessors */
//   var edgeGeometry = new THREE.Geometry();
//   for(let i = 0; i < innerNodes['nodes'].length; i++)
//   {
//     /** Store (array of) predecessor(s) */
//     let predecessor = innerNodes['nodes'][i].predecessor;
//     let innerIndex = parseInt(innerNodes['nodes'][i].id)*32;
//     /** Store position(s) of predecessor(s) */
//     predecessor = predecessor.split(",");
//     var v1 = new THREE.Vector3(innerMesh.geometry.faces[innerIndex].position.x, innerMesh.geometry.faces[innerIndex].position.y, innerMesh.geometry.faces[innerIndex].position.z);
//     for(let j = 0; j < predecessor.length; j++)
//     {
//       let pos = findPos(predecessor[j], outerNodes['nodes']);
//       let outerIndex = parseInt(outerNodes['nodes'][pos].id)*32;
//       var v2 = new THREE.Vector3(outerMesh.geometry.faces[outerIndex].position.x, outerMesh.geometry.faces[outerIndex].position.y, outerMesh.geometry.faces[outerIndex].position.z);
//       edgeGeometry.vertices.push(v1);
//       edgeGeometry.vertices.push(v2);
//     }
//   }
//   for(let i = 0; i < edgeGeometry.vertices.length; i++)
//   {
//     edgeGeometry.colors[i] = new THREE.Color(0xFF0000);
//     edgeGeometry.colors[i+1] = edgeGeometry.colors[i];
//   }
//   edgeGeometry.verticesNeedUpdate = true;
//   edgeGeometry.colorsNeedUpdate = true;
//
//   /** Create one LineSegments and add it to scene */
//   var edgeMaterial = new THREE.LineBasicMaterial({vertexColors:  THREE.VertexColors});
//   var lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial, THREE.LinePieces);
//   scene.add(lineSegments);
//
//   edgeGeometry.dispose();
//   edgeGeometry = null;
//   edgeMaterial.dispose();
//   edgeMaterial = null;
// }
//
// /**
//  * Render a bipartite graph, given a .json file.
//  * @public
//  * @param {(string|Array)} data String of graph (or graphs) to be parsed into JSON notation and rendered.
//  * @param {int} layout Graph layout. Default is 2 (bipartite horizontal).
//  */
// function build(data, layout, min, max)
// {
//   /** Remove any information from graphs */
//   removeGraphInfo();
//   /** Check and treat incoming response */
//   data = JSON.parse(data);
//   graphName = data.graphName;
//   numOfLevels = data.nLevels;
//   firstSet = data.firstSet;
//   secondSet = data.secondSet;
//   data = data.graph;
//   min = ecmaStandard(min, 10);
//   max = ecmaStandard(max, 70);
//   lay = ecmaStandard(layout, 2);
//   /* Converting text string to JSON */
//   var jason = JSON.parse(data);
//
//   /* Display bipartite graph info */
//   // displayGraphInfo(jason);
//
//   /* Instantiating Graph */
//   if(bipartiteGraph !== undefined) delete bipartiteGraph;
//   bipartiteGraph = new BipartiteGraph(jason, 8, "", min, max);
//   // bipartiteGraph = new BipartiteGraph(jason, 10, 70);
//
//   if(renderer == undefined)
//   {
//       /* Get the size of the inner window (content area) to create a full size renderer */
//       canvasWidth = (document.getElementById("mainSection").clientWidth);
//       canvasHeight = (document.getElementById("mainSection").clientHeight);
//       /* Create a new WebGL renderer */
//       renderer = new THREE.WebGLRenderer({antialias:true});
//       /* Set the background color of the renderer to black, with full opacity */
//       renderer.setClearColor("rgb(255, 255, 255)", 1);
//       /* Set the renderers size to the content area size */
//       renderer.setSize(canvasWidth, canvasHeight);
//   }
//   else
//   {
//       renderer.setRenderTarget(null);
//       renderer.clear();
//   }
//
//   /* Create scene */
//   if(scene !== undefined)
//   {
//     disposeHierarchy(scene, disposeNode);
//     for(var i = scene.children.length - 1; i >= 0; i--)
//     {
//       scene.remove(scene.children[i]);
//     }
//     delete scene;
//   }
//   else
//   {
//     scene = new THREE.Scene();
//   }
//
//   /* Get the DIV element from the HTML document by its ID and append the renderers' DOM object to it */
//   document.getElementById("WebGL").appendChild(renderer.domElement);
//
//   /* Build bipartiteGraph */
//   // bipartiteGraph.buildGraph(jason, scene, lay);
//   /* Render bipartiteGraph */
//   bipartiteGraph.renderGraph(jason, scene, lay);
//
//   if(bipartiteGraphs !== undefined) bipartiteGraphs = [];
//   var nLevels = 0;
//   // for(var i = 0; i < parseInt(numOfLevels)-1; i = i + 1)
//   /** Construct new bipartite graphs from previous levels of coarsening */
//   for(let i = parseInt(numOfLevels); i >= 0; i = i - 1)
//   {
//     var gName = graphName.split(".")[0];
//     gName = gName.substring(0, gName.length-2);
//     i == 0 ? gName = gName.substring(0, gName.lastIndexOf('Coarsened')) + ".json" : gName = gName + "n" + (i).toString() + ".json";
//     if(gName !== ".json")
//     {
//       $.ajax({
//         async: false,
//         url: '/getLevels',
//         type: 'POST',
//         data: gName,
//         processData: false,
//         contentType: false,
//         success: function(data){
//           /** Store JSON graph in array */
//           bipartiteGraphs.push(JSON.parse(JSON.parse(data).graph));
//           displayGraphInfo(bipartiteGraphs[bipartiteGraphs.length-1]);
//           // bipartiteGraphs[bipartiteGraphs.length-1].renderNodes(JSON.parse(JSON.parse(data).graph), scene, lay, new IndependentSet(), new IndependentSet());
//           // nLevels = nLevels + 1;
//           // var coarsenedBipartiteGraph = new BipartiteGraph(JSON.parse(JSON.parse(data).graph), bipartiteGraph.distanceBetweenSets - (nLevels+2), (nLevels+1).toString());
//           // /** Render independent sets in scene */
//           // coarsenedBipartiteGraph.renderNodes(JSON.parse(JSON.parse(data).graph), scene, lay, new IndependentSet(), new IndependentSet());
//           // /** Make connections with coarsened vertexes - use ajax call to get .cluster file, containing coarsened super vertexes */
//           // $.ajax({
//           //   url: '/getClusters',
//           //   type: 'POST',
//           //   data: gName + "n" + (i).toString() + ".cluster",
//           //   processData: false,
//           //   contentType: false,
//           //   success: function(data){
//           //     connectLevels(data, scene, parseInt(numOfLevels)-1, i-1);
//           //   },
//           //   xhr: loadGraph
//           // });
//         },
//         xhr: loadGraph
//       });
//     }
//     else
//     {
//       displayGraphInfo(jason);
//     }
//   }
//   /** Sort array */
//   bipartiteGraphs.sort(function(a, b){
//     if(a.graphInfo[0].graphSize < b.graphInfo[0].graphSize) return -1;
//     else if(a.graphInfo[0].graphSize > b.graphInfo[0].graphSize) return 1;
//     else return 0;
//   });
//   /** Render previous uncoarsened graphs */
//   nLevels = 0;
//   // for(let i = parseInt(numOfLevels); i > 0; i = i - 1)
//   for(let i = bipartiteGraphs.length-1; i >= 0; i = i - 1)
//   {
//     var coarsenedBipartiteGraph;
//     if(i != 0)
//     {
//       coarsenedBipartiteGraph = new BipartiteGraph(bipartiteGraphs[i], bipartiteGraph.distanceBetweenSets - (i+1), (i).toString());
//       coarsenedBipartiteGraph.renderNodes(bipartiteGraphs[i], scene, lay, new IndependentSet(), new IndependentSet());
//     }
//     nLevels = nLevels + 1;
//     /** Connect super vertexes */
//     // if(i == 1 || i < parseInt(numOfLevels))
//     if(i < bipartiteGraphs.length-1)
//     {
//       connectVertexes(bipartiteGraphs[i], bipartiteGraphs[i+1], i, i+1);
//     }
//   }
//   /** Fetch .cluster files and connect nodes based on such files */
//   // nLevels = parseInt(numOfLevels);
//   // for(let i = 0; i < parseInt(numOfLevels); i++)
//   // {
//   //   var gName = graphName.split(".")[0];
//   //   gName = gName.substring(0, gName.length-2);
//   //   gName = gName + "n" + nLevels.toString() + ".cluster";
//   //   nLevels = nLevels - 1;
//   //   $.ajax({
//   //     async: false,
//   //     url: '/getClusters',
//   //     type: 'POST',
//   //     data: gName,
//   //     processData: false,
//   //     contentType: false,
//   //     success: function(data){
//   //       connectLevels(data, scene, i+1, i);
//   //     },
//   //     xhr: loadGraph
//   //   });
//   // }
//
//   /** Create edge gradient legend */
//   if(gradientLegend !== undefined)
//   {
//       gradientLegend.clear();
//       delete gradientLegend;
//   }
//   // gradientLegend = new GradientLegend(bipartiteGraph.linearScale, bipartiteGraph.graphInfo, bipartiteGraph.minEdgeWeight, bipartiteGraph.maxEdgeWeight, 300, 50);
//   /** Use minimum edge weight and maximum edge weight as domain values */
//   gradientLegend = new GradientLegend(bipartiteGraph.linearScale, bipartiteGraph.graphInfo.minEdgeWeight, bipartiteGraph.graphInfo.maxEdgeWeight, 300, 50, 5);
//   gradientLegend.createGradientLegend("gradientScale", "Edge weights:");
//
//   delete jason;
//
//   /* Create the camera and associate it with the scene */
//   if(camera !== undefined) delete camera;
//   camera = new THREE.PerspectiveCamera(120, canvasWidth / canvasHeight, 1, 2000);
//   camera.position.set(0, 0, cameraPos);
//   camera.lookAt(scene.position);
//   camera.name = "camera";
//   scene.add(camera);
//
//   /* Create simple directional light */
//   if(light !== undefined) delete light;
//   light = new THREE.DirectionalLight();
//   light.position.set(0, 0, 10);
//   scene.add(light);
//
//   /* Using orbitControls for moving */
//   if(controls !== undefined) delete controls;
//   var controls = new THREE.OrbitControls(camera, renderer.domElement);
//
//   /* Setting up params */
//   controls.minDistance = 1;
//   controls.maxDistance = 500;
//   controls.zoomSpeed = 1.5;
//   controls.target.set(0, 0, 0);
//   controls.enableRotate = false;
//   controls.enableKeys = false;
//
//   controls.mouseButtons = { PAN: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, ORBIT: THREE.MOUSE.RIGHT };
//
//   /** Creating event listener */
//   if(eventHandler === undefined)
//   {
//     eventHandler = new EventHandler(undefined);
//     /* Adding event listeners */
//     document.addEventListener('resize', function(evt){
//       camera.aspect = document.getElementById("WebGL").clientWidth / document.getElementById("WebGL").clientHeight;
//       camera.updateProjectionMatrix();
//       renderer.setSize(document.getElementById("WebGL").clientWidth, document.getElementById("WebGL").clientHeight);
//     }, false);
//     document.addEventListener('mousemove', function(evt){eventHandler.mouseMoveEvent(evt, renderer, scene);}, false);
//     document.addEventListener('dblclick', function(evt){
//       eventHandler.mouseDoubleClickEvent();
//       // eventHandler.mouseDoubleClickEvent(clicked, evt, bipartiteGraph);
//       // !clicked ? clicked = true : clicked = false;
//     }, false);
//     document.addEventListener('click', function(evt){
//       eventHandler.mouseClickEvent(evt, renderer, scene);
//     }, false);
//   }
//
//   // console.log(renderer.info);
//   animate();
//
//   function animate()
//   {
//       /* Render scene */
//       renderer.render(scene, camera);
//
//       /* Tell the browser to call this function when page is visible */
//       requestAnimationFrame(animate);
//
//       /* Capture graph image (when requested) */
//       if(capture)
//       {
//         capture = false;
//         var dataURL = document.getElementsByTagName('canvas')[0].toDataURL('image/png');
//         var wd = window.open('about:blank', 'graph');
//         wd.document.write("<img src='" + dataURL + "' alt='from canvas'/>");
//         wd.document.close();
//       }
//   }
// }

/**
 * Base class for d3's bar chart, to visualize vertex stats. Based on https://bl.ocks.org/mbostock/3885304#index.html
 * @author Diego Cintra
 * Date: 31 july 2018
 */

 /**
  * @constructor
  * @param {String} HTMLelement HTML element to build d3BarChart div in.
  */
var d3BarChart = function(HTMLelement)
{
  try
  {
    /** Store parent element to create bar chart */
    this.parentElement = HTMLelement;
    this.barChart = this.margin = this.width = this.height = this.x = this.y = this.g = undefined;
    this.setCreate(false);
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in barChart constructor. " + err;
  }
}

/**
 * @desc Getter for margin.
 * @returns {Object} Margin properties.
 */
d3BarChart.prototype.getMargin = function()
{
  return this.margin;
}

/**
 * @desc Setter for margin.
 * @param {Object} margin Margin properties.
 */
d3BarChart.prototype.setMargin = function(margin)
{
  this.margin = margin;
}

/**
 * @desc Getter for width.
 * @returns {Object} width.
 */
d3BarChart.prototype.getWidth = function()
{
  return this.width;
}

/**
 * @desc Setter for width.
 * @param {Object} width width.
 */
d3BarChart.prototype.setWidth = function(width)
{
  this.width = width;
}

/**
 * @desc Getter for height.
 * @returns {Object} height.
 */
d3BarChart.prototype.getHeight = function()
{
  return this.height;
}

/**
 * @desc Setter for height.
 * @param {Object} height height.
 */
d3BarChart.prototype.setHeight = function(height)
{
  this.height = height;
}

/**
 * @desc Getter for x.
 * @returns {Object} x.
 */
d3BarChart.prototype.getX = function()
{
  return this.x;
}

/**
 * @desc Setter for x.
 * @param {Object} x x.
 */
d3BarChart.prototype.setX = function(x)
{
  this.x = x;
}

/**
 * @desc Getter for y.
 * @returns {Object} y.
 */
d3BarChart.prototype.getY = function()
{
  return this.y;
}

/**
 * @desc Setter for y.
 * @param {Object} y y.
 */
d3BarChart.prototype.setY = function(y)
{
  this.y = y;
}

/**
 * @desc Getter for g (group).
 * @returns {Object} g group structure.
 */
d3BarChart.prototype.getG = function()
{
  return this.g;
}

/**
 * @desc Setter for g (group).
 * @param {Object} g g group structure.
 */
d3BarChart.prototype.setG = function(g)
{
  this.g = g;
}

/**
 * @desc Getter for created.
 * @returns {Boolean} True if bar chart was created; false otherwise.
 */
d3BarChart.prototype.getCreate = function()
{
  return this.created;
}

/**
 * @desc Setter for created.
 * @param {Boolean} True if bar chart was created; false otherwise.
 */
d3BarChart.prototype.setCreate = function(created)
{
  this.created = created;
}

/**
 * @desc Define sizes.
 * @param {Number} width Width size.
 * @param {Number} height Height size.
 */
d3BarChart.prototype.defineSizes = function(width, height)
{
  this.setWidth(width);
  this.setHeight(height);
}

/**
 * @desc Define axes.
 * @param {int} x X axis.
 * @param {int} y Y axis.
 */
d3BarChart.prototype.defineAxes = function(x, y)
{
  this.setX(x);
  this.setY(y);
}

/**
 * @desc Define bar chart position.
 * @param {string} position String-like parameter to be used in "transform" attribute, e.g. "translate(...)", "rotate(...)".
 */
d3BarChart.prototype.definePosition = function(position)
{
  try
  {
    if(this.getG() == undefined)
    {
      this.setG(this.barChart.append("g"));
    }
    this.getG()
      .attr("transform", position);
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in function definePosition. " + err;
  }
}

/**
 * @desc Creates a d3 bar chart on HTML page, to check for vertex info.
 * @public
 * @param {String} HTMLelement HTML element to build d3BarChart div in; if specified, replaces "this.parentElement" value.
 */
d3BarChart.prototype.created3BarChart = function(HTMLelement)
{
  /** FIXME - receive width and height from parameters */
  var height = 300;
  var width = 600;
  this.parentElement = ecmaStandard(HTMLelement, this.parentElement);
  /** Create bar chart */
  this.barChart = d3.select("#" + this.parentElement)
    .append("svg")
    .attr("id", "vStats")
    .attr("width", width)
    .attr("height", height)
    .style("z-index", "100");
  /** Define dimensions if none was defined */
  if(this.getMargin() == undefined)
  {
    this.setMargin({top: 20, right: 20, bottom: 150, left: 50});
    /** Define sizes */
    this.defineSizes(+width - this.getMargin().left - this.getMargin().right, +height - this.getMargin().top - this.getMargin().bottom);
    /** Define axes */
    this.defineAxes(d3.scaleBand().rangeRound([0, this.getWidth()]).padding(0.1), d3.scaleLinear().rangeRound([this.getHeight(), 0]));
    /** Define default position */
    this.definePosition("translate(" + this.getMargin().left + "," + this.getMargin().top + ")");
  }
  /** Create barChart initially hidden */
  this.hideBarChart();
}

/**
 * @desc Populates bar chart and set its opacity to 1.
 * @public
 * @param {String} data String-like data to populate bar chart.
 */
d3BarChart.prototype.populateAndShowBarChart = function(data)
{
  this.populateBarChart(data);
  if(data.length != 0) this.showBarChart();
}

/**
 * FIXME - Not d3BarChart responsibility
 * @desc Return bar chart data properties, to be used as labels for x axis.
 * @param {Array} data String-like or Array data to populate bar chart.
 * @returns {Array} Sorted array of properties.
 */
d3BarChart.prototype.getProperties = function(data)
{
  var dict = {};
  for(element in data)
  {
    if(!(data[element].property in dict))
    {
      dict[data[element].property] = 1;
    }
  }
  return Object.keys(dict).sort();
}

/**
 * @desc Create dashed lines according to number of categories and amount of values for each category.
 * @public
 * @param {(String|Array)} data String-like or Array data to populate bar chart.
 */
d3BarChart.prototype.createDashedLines = function(data)
{
  // /** Count number of categories and values for each category */
  // var cats = {};
  // for(var i = 0; i < data.length; i++)
  // {
  //   if(!(data[i].property in cats))
  //   {
  //     if(i != 0)
  //     {
  //       cats[data[i-1].property].endIndex = i;
  //     }
  //     cats[data[i].property] = { startIndex: i, endIndex: -1 };
  //   }
  // }
  // /** Draw lines according to number of properties */
  // var properties = Object.keys(cats);
  // for(var i = 0; i < properties.length-1; i++)
  // {
  //   /** Draw line according to start and end indexes */
  //   this.getG().append('line')
  //       // .attr('x1', (cats[properties[i]].endIndex*this.getX().bandwidth())+(cats[properties[i]].startIndex*this.getX().bandwidth())+32)
  //       .attr('x1', (cats[properties[i]].endIndex*this.getX().bandwidth()))
  //       .attr('y1', 0)
  //       // .attr('x2', (cats[properties[i]].endIndex*this.getX().bandwidth())+(cats[properties[i]].startIndex*this.getX().bandwidth())+32)
  //       .attr('x2', (cats[properties[i]].endIndex*this.getX().bandwidth()))
  //       .attr('y2', this.getHeight())
  //       .style("stroke-dasharray", ("3, 3"))
  //       .style("stroke-width", "2")
  //       .style("stroke", "rgb(0, 0, 0)");
  // }
}

/**
 * @desc Populates bar chart with information provided by data, setting domains and ticks for axes.
 * @public
 * @param {(String|Array)} data String-like or Array data to populate bar chart.
 */
d3BarChart.prototype.populateBarChart = function(data)
{
  try
  {
    this.getX().domain(data.map(function(d) { return d.categories; }));
    this.getY().domain([0, d3.max(data, function(d) { return d.percentage; })]);

    this.getG().append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + this.getHeight() + ")")
        .call(d3.axisBottom(this.getX()))
        .selectAll("text")
        .attr("transform", "rotate(90)")
        // .attr("x", 22)
        .attr("x", 60)
        .attr("y", -6);

    /** Add label for x-axis */
    this.barChart.append("text")
    	  .attr("transform", "translate(" + (this.getWidth()/2) + " ," + (this.getHeight()+150) + ")")
    	  .style("text-anchor", "middle")
    	  .text(this.getProperties(data));

    this.getG().append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(this.getY()).ticks(10).tickFormat(function(d){ return d + "%"; }))
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -20)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Frequency");

    /** Create a dashed line to separate different bar charts */
    this.createDashedLines(data);

  	// // text label for the x axis
  	// this.barChart().append("text")
  	//   .attr("transform",
  	//         "translate(" + (this.getWidth()/2) + " ," +
  	//                        (this.getHeight() + this.getMargin().top + 40) + ")")
  	//   .style("text-anchor", "middle")
  	//   .text("Date");
    //
  	// // text label for the y axis
  	// this.barChart().append("text")
  	//   .attr("transform", "rotate(-90)")
  	//   .attr("y", 0 - this.getMargin().left)
  	//   .attr("x", 0 - (this.getHeight() / 2))
  	//   .attr("dy", "1em")
  	//   .style("text-anchor", "middle")
  	//   .text("Value");

    /** Create bar chart */
    this.createBarChart(data);
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in function populateBarChart. " + err;
  }
}

/**
 * @desc Creates a bar chart, with given data.
 * @public
 * @param {(String|Array)} data String-like or Array data to populate bar chart.
 */
d3BarChart.prototype.createBarChart = function(data)
{
  var d3Scope = this;
  this.getG().selectAll(".bar")
    .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return d3Scope.getX()(d.categories); })
      .attr("y", function(d) { return d3Scope.getY()(d.percentage); })
      .attr("width", this.getX().bandwidth())
      .attr("height", function(d) { return d3Scope.getHeight() - d3Scope.getY()(d.percentage); });
  this.setCreate(true);
}

/**
 * @desc Shows bar chart by setting opacity to 1.
 * @public
 */
d3BarChart.prototype.showBarChart = function()
{
  this.barChart.style("opacity", 1);
}

/**
 * @desc Hides bar chart by setting opacity to 0.
 * @public
 */
d3BarChart.prototype.hideBarChart = function()
{
  this.barChart.style("opacity", 0);
}

/**
 * @desc Clear bar chart content.
 * @public
 */
d3BarChart.prototype.clearBarChart = function()
{
  // this.barChart.html();
  d3.select("#vStats").remove();
  this.barChart = this.margin = this.width = this.height = this.x = this.y = this.g = undefined;
  this.setCreate(false);
}

/**
 * Base class for positioning d3 elements in an HTML page.
 * @author Diego Cintra
 * Date: 08 November 2018
 */

/**
 * @class d3Position
 */
class d3Position
{
  /**
   * @constructor
   * @param {String} HTMLelement HTML element to build d3WordCloud div in.
   * @param {Number} width Width of element.
   * @param {Number} height Height of element.
   * @param {Number} margin Margin of element.
   */
  constructor(HTMLelement, width, height, margin = 2)
  {
    this.HTMLelement = HTMLelement;
    this.width = width;
    this.height = height;
    this.margin = margin;
  }

  /**
   * @desc Getter for margin.
   * @returns {Number} Margin properties.
   */
   getMargin()
   {
     return this.margin;
   }

   /**
    * @desc Setter for margin.
    * @param {Number} margin Margin properties.
    */
    setMargin(margin)
    {
      this.margin = margin;
    }

    /**
     * @desc Getter for width.
     * @returns {Number} width.
     */
    getWidth()
    {
      return this.width;
    }

    /**
     * @desc Setter for width.
     * @param {Number} width width.
     */
     setWidth(width)
     {
       this.width = width;
     }

     /**
      * @desc Getter for height.
      * @returns {Number} height.
      */
     getHeight()
     {
       return this.height;
     }

     /**
      * @desc Setter for height.
      * @param {Number} height height.
      */
     setHeight(height)
     {
       this.height = height;
     }

     /**
      * @desc Getter for HTMLelement.
      * @returns {String} HTMLelement.
      */
     getHTMLelement()
     {
       return this.HTMLelement;
     }

     /**
      * @desc Setter for HTMLelement.
      * @param {String} HTMLelement HTMLelement.
      */
     setHTMLelement(HTMLelement)
     {
       this.HTMLelement = HTMLelement;
     }

     /**
      * @desc Clear element from HTML page.
      * @param {String} svgElement <svg> tag to be removed from HTML page.
      */
     clearElement(svgElement)
     {
       d3.select(svgElement).remove();
       this.width = this.height = this.margin = undefined;
     }
}

/**
 * Base class for d3's tooltip, to visualize vertex info inside a node. Based on https://evortigosa.github.io/pollution/
 * @author Diego Cintra
 * Date: 22 may 2018
 */

/**
 * @constructor
 * @param {String} HTMLelement HTML element to build d3Tooltip div in.
 */
var d3Tooltip = function(HTMLelement)
{
  try
  {
    /** Store parent element to create tooltip */
    this.parentElement = HTMLelement;
    this.tooltip = undefined;
    /** Offsets from mouse so that tooltip won't show on top of mouse */
    this.xOffset = 70;
    this.yOffset = 28;
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in d3Tooltip constructor. " + err;
  }
}

/**
 * @desc Creates a d3 tooltip on HTML page, to check for vertex info.
 * @public
 * @param {String} HTMLelement HTML element to build d3Tooltip div in; if specified, replaces "this.parentElement" value.
 */
d3Tooltip.prototype.created3Tooltip = function(HTMLelement)
{
  this.parentElement = ecmaStandard(HTMLelement, this.parentElement);
  /** Create tooltip */
  this.tooltip = d3.select(this.parentElement)
    .append("div")
    .attr("class", "tooltip")
    .style("z-index", "100");
  /** Create tooltip initially hidden */
  this.hideTooltip();
}

/**
 * @desc Populates tooltip and set its opacity to 1.
 * @public
 * @param {String} data String-like data to populate tooltip.
 */
d3Tooltip.prototype.populateAndShowTooltip = function(data)
{
  this.populateTooltip(data);
  if(data.length != 0) this.showTooltip();
}

/**
 * @desc Use input data to generate HTML table format, using classes from material design lite.
 * @param {(String|Array)} data String-like or Array data to populate tooltip.
 * @returns {String} HTML table.
 */
d3Tooltip.prototype.generateHTMLTable = function(data)
{
  var table = "<table class=\"mdl-cell mdl-cell--12-col mdl-data-table mdl-js-data-table mdl-shadow--2dp\"><thead><tr>";
  for(var i = 0; i < data.length; i++)
  {
    for(key in data[i].rows)
    {
      table = table + "<th class=\"mdl-data-table__cell--non-numeric\">" + key + "</th>";
    }
    table = table + "</tr></thead>";
    // for(key in data[i].rows)
    // {
    //
    // }
  }
  return table;
}

/**
 * @desc Populates tooltip with information provided by data.
 * @public
 * @param {(String|Array)} data String-like or Array data to populate tooltip.
 */
d3Tooltip.prototype.populateTooltip = function(data)
{
  try
  {
    this.tooltip.html(JSON.stringify(data, undefined, 5));
    // this.tooltip.html(this.generateHTMLTable(data));
    // for(var i = 0; i < data.rows.length; i++)
    // {
    //   for(key in data.rows[i])
    //   {
    //     console.log(key);
    //     console.log(data.rows[i][key]);
    //   }
    // }
    // this.tooltip.html(data);
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in function populateTooltip. " + err;
  }
}

/**
 * @desc Hides tooltip by setting opacity to 0.
 * @public
 */
d3Tooltip.prototype.hideTooltip = function()
{
  this.tooltip.style("opacity", 0);
}

/**
 * @desc Shows tooltip by setting opacity to 1.
 * @public
 */
d3Tooltip.prototype.showTooltip = function()
{
  this.tooltip.style("opacity", 1);
}

/**
 * @desc Clear tooltip content.
 * @public
 */
d3Tooltip.prototype.clearTooltip = function()
{
  this.tooltip.html();
}

/**
 * @desc Set tooltip position according to x and y values.
 * @param {int} x X offset to place tooltip.
 * @param {int} y Y offset to place tooltip.
 */
d3Tooltip.prototype.setPosition = function(x, y)
{
  this.tooltip.style("left", (x - this.xOffset) + "px").style("top", (y - this.yOffset) + "px");
}

/**
 * Base class for d3's word cloud, to visualize vertex values as word clouds. Using word cloud code from https://github.com/jasondavies/d3-cloud, and based on https://bl.ocks.org/jyucsiro/767539a876836e920e38bc80d2031ba7
 * @author Diego Cintra
 * Date: 08 November 2018
 */

class d3WordCloud extends d3Position
{
  /**
   * @constructor
   * @param {String} HTMLelement HTML element to build d3WordCloud div in.
   * @param {Number} width Width of element.
   * @param {Number} height Height of element.
   * @param {Number} margin Margin of element.
   * @param {Array} words Array of word objects, containing attributes such as "font", "width", "height" and "value".
   */
   constructor(HTMLelement, width, height, margin, words = undefined)
   {
     super(HTMLelement, width, height, margin);
     if(words != undefined) this.setWords(words);
   }

   /**
    * @desc Getter for words.
    * @returns {Array} Array of words.
    */
   getWords()
   {
     return this.words;
   }

   /**
    * @desc Setter for words.
    * @param {Array} words Array of words.
    */
   setWords(words)
   {
     this.words = words;
   }

   /**
    * @desc Getter for xScale.
    * @param {Object} word Word to be scaled.
    * @returns {Object} Scaling function.
    */
   getXScale(word)
   {
     return this.xScale(word);
   }

   /**
    * @desc Setter for xScale.
    * @param {Object} words Set of words to be scaled to a specific domain.
    */
   setXScale(words)
   {
     this.xScale = d3.scaleLinear()
          .domain([d3.min(words, function(d){
             return parseFloat(d.value);
           }), d3.max(words, function(d){
             return parseFloat(d.value);
           })])
          .range([10,45]);
   }

   /**
    * @desc Clear word cloud from HTML page.
    */
   clearWordCloud()
   {
     super.clearElement("#wordCloudStats");
    //  d3.select("#wordCloudStats").remove();
    //  this.HTMLelement = super.getWidth() = super.getHeight() = super.getMargin() = this.words = undefined;
   }

   /**
    * FIXME - Not working outside of anonymous function
    * @desc Draw word cloud in container.
    * @param {Array} words Array of words resulting from 'd3.layout.cloud' (callback defined parameter)
    */
   drawWordCloud(words)
   {
     var width = 500, height = 400;
     var fill = d3.scaleOrdinal(d3.schemeCategory20);
     var d3WordCloudScope = this;
     d3.select("#wordCloudCard").append("svg")
        .attr("id", "wordCloudStats")
        .attr("width", 500)
        .attr("height", 400)
      .append("g")
        .attr("transform", "translate(" + [500 >> 1,  400 >> 1] + ")")
      .selectAll("text")
      .data(words)
      .enter().append("text")
        .style("font-size", function(d) { return d3WordCloudScope.getXScale(d.value) + "px"; })
        .style("font-family", "Palatino")
        .style("fill", function(d, i) { return fill(i); })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.key; });

     d3.layout.cloud().stop();
   }

   /**
    * @desc Create a word cloud and display it on HTML page.
    * @param {Array} words Array of word objects, containing attributes such as "font", "width", "height" and "value".
    * @param {String} HTMLelement HTML element to build d3BarChart div in; if specified, replaces "this.parentElement" value.
    * @param {Number} width Width of element; if specified, replaces "super.getWidth()" value.
    * @param {Number} height Width of element; if specified, replaces "super.getWidth()" value.
    */
   created3WordCloud(words, HTMLelement, width, height)
   {
     try
     {
      // super.setHTMLelement(ecmaStandard(HTMLelement, super.getHTMLelement()));
      // super.setWidth(ecmaStandard(width, super.getWidth()));
      // super.setHeight(ecmaStandard(width, super.getHeight()));
      this.setWords(ecmaStandard(words, this.getWords()));
      var wordEntries = d3.entries(this.getWords());
      /** Scale words from its domain to range [10,100] */
      this.setXScale(wordEntries);
      var d3WordCloudScope = this;
      /** Define word cloud  */
      d3.layout.cloud().size([500, 400])
          .timeInterval(20)
          .words(wordEntries)
          .fontSize(function(d) { return d3WordCloudScope.getXScale(+d.value); })
          .text(function(d) { return d.key; })
          .rotate(function() { return ~~(Math.random() * 2); })
          // .rotate(function() { return ~~(Math.random() * 2) * 90; })
          .font("Palatino")
          .on("end", function(words){
            var fill = d3.scaleOrdinal(d3.schemeCategory20);
            d3.select("#wordCloudCard").append("svg")
               .attr("id", "wordCloudStats")
               .attr("width", 500)
               .attr("height", 400)
             .append("g")
               .attr("transform", "translate(" + [250,  200] + ")")
             .selectAll("text")
             .data(words)
             .enter().append("text")
               .style("font-size", function(d) { return d3WordCloudScope.getXScale(d.value) + "px"; })
               .style("font-family", "Palatino")
               .style("fill", function(d, i) { return fill(i); })
               .attr("text-anchor", "middle")
               .attr("transform", function(d) {
                 return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
               })
               .text(function(d) { return d.key; });

            d3.layout.cloud().stop();
          })
          .start();
     }
     catch(err)
     {
       throw "Unexpected error ocurred at line " + err.lineNumber + ", in function created3WordCloud. " + err;
     }
   }
}

/**
 * Base class for d3's word cloud, serving as bridge between client and server side operations, mostly to fetch words server side.
 * @author Diego Cintra
 * Date: 08 November 2018
 */

class d3WordCloudWrapper
{
  /**
   * @constructor
   */
  constructor()
  {
    /** Default constructor, nothing to be done here */
  }

  /**
   * @desc Make an AJAX call to fetch words server-side.
   * @param {Object} clickedNode Clicked node.
   * @param {Object} d3WordCloud d3WordCloud object to call callback response.
   * @returns {Array} Array of words, respecting https://github.com/jasondavies/d3-cloud syntax.
   */
  fetchWords(clickedNode, d3WordCloud)
  {
    // let words;
    $.ajax({
      url: '/graph/fetchWords',
      type: 'POST',
      async: true,
      data: { node: clickedNode },
      success: function(data){
        // words = JSON.parse(data).frequencies;
        d3WordCloud.created3WordCloud(JSON.parse(data).frequencies, 500, 400);
      }
    });
    // return words;
  }
}

/**
 * @desc Base class for DoubleClick, handling user's double click on layout.
 * @author Diego Cintra
 * Date: 27 July 2018
 */

/**
 * @constructor
 * @param {Object} clicked State variable to check if layout has been clicked or not.
 */
var DoubleClick = function(clicked)
{
  this.clicked = ecmaStandard(clicked, {wasClicked: false});
}

/**
 * @desc Getter for clicked.
 * @returns {Object} clicked object.
 */
DoubleClick.prototype.getClicked = function()
{
  return this.clicked;
}

/**
 * @desc Setter for clicked.
 * @param {Object} clicked Object indicating double-click state in layout.
 */
DoubleClick.prototype.setClicked = function(clicked)
{
  this.clicked = clicked;
}

/**
 * @desc Check duplicates in array of neighbors.
 * @param {Array} neighbors Array of neighbors.
 * @returns {Array} Array with no duplicates.
 */
DoubleClick.prototype.checkDuplicates = function(neighbors)
{
  var arr = [];
  for(var i = 0; i < neighbors.length; i++)
  {
    for(var j = i+1; j < neighbors.length; j++)
    {
      if( (neighbors[i].vertexInfo == neighbors[j].vertexInfo/32) || (neighbors[i].vertexInfo == neighbors[j].vertexInfo*32) )
      {
        neighbors[j] = -1;
      }
    }
  }
  for(var i = 0; i < neighbors.length; i++)
  {
    if(neighbors[i] != -1)
    {
      arr.push(neighbors[i]);
    }
  }
  return arr;
}

/**
 * @desc Update layout, removing edges and coloring vertexes to default color.
 * @param {Object} scene Scene for raycaster.
 * @param {Object} eventHandler EventHandler type object containing neighbors and edges arrays.
 */
DoubleClick.prototype.updateLayout = function(scene, eventHandler)
{
  eventHandler.neighbors = this.checkDuplicates(eventHandler.neighbors);
  /** Change vertexes colors to original color */
  for(var i = 0; i < eventHandler.neighbors.length; i++)
  {
    var mesh = scene.getObjectByName(eventHandler.neighbors[i].mesh);
    for(var j = 0; j < 32; j++)
    {
      if(mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j] !== undefined && mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)].properties !== undefined)
      {
        // mesh.name == "MainMesh" ? mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j].color.setRGB(0.0, 0.0, 0.0) : mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j].color.setRGB(0.8, 0.8, 0.8);
        mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j].color.setRGB(mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j].color.r-0.3, mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j].color.g-0.3, mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo*32)+j].color.b-0.3);
      }
      else if(mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j] !== undefined && mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)].properties !== undefined)
      {
        // mesh.name == "MainMesh" ? mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j].color.setRGB(0.0, 0.0, 0.0) : mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j].color.setRGB(0.8, 0.8, 0.8);
        mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j].color.setRGB(mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j].color.r-0.3, mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j].color.g-0.3, mesh.geometry.faces[(eventHandler.neighbors[i].vertexInfo)+j].color.b-0.3);
      }
      mesh.geometry.colorsNeedUpdate = true;
    }
  }
  /** Clearing array of neighbors */
  eventHandler.neighbors = [];
  eventHandler.realNeighbors = [];
  /** Remove 'parentConnections' edges */
  // for(var i = 0; i < edges; i++)
  for(var i = 0; i < eventHandler.nEdges; i++)
  {
    scene.remove(scene.getObjectByName("parentConnections" + i.toString()));
  }
  /** Remove 'neighborEdges' edges */
  scene.remove(scene.getObjectByName("neighborEdges"));
  /** Remove 'selected' vertices */
  scene.remove(scene.getObjectByName("selected"));
  var indexes = [];
  /** Remove 'neighboriindex', 'predecessori' or 'successori' vertices */
  for(var i = 0; i < scene.children.length; i++)
  {
    // if(scene.children[i].name.substring(0, scene.children[i].name.length-1) == 'neighbor' || scene.children[i].name.substring(0, scene.children[i].name.length-1) == 'predecessor' || scene.children[i].name.substring(0, scene.children[i].name.length-1) == 'successor')
    if(scene.children[i].name.includes('neighbor') || scene.children[i].name.includes('predecessor') || scene.children[i].name.includes('successor'))
    {
      indexes.push(i);
      // scene.remove(scene.children[i]);
    }
  }
  indexes.sort(function(a, b){
    return parseInt(b)-parseInt(a);
  });
  for(var i = 0; i < indexes.length; i++)
  {
    scene.remove(scene.children[indexes[i]]);
  }
  /**
   * @param {Array} neighbors Array of neighbor vertexes.
   * @param {Array} edges Array of edges displayed in layout.
  */
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
 * @param {String} HTMLelement HTML element to build d3Tooltip div in.
 * @param {String} SVGId Id to store <svg> id value.
 * @param {int} numOfLevels Number of coarsened graphs.
 * @param {String} d3WordCloudId HTML element to build d3WordCloud in.
 */
var EventHandler = function(raycaster, HTMLelement, SVGId, numOfLevels, d3WordCloudId)
{
    this.raycaster = ecmaStandard(raycaster, new THREE.Raycaster());
    this.raycaster.linePrecision = 0.1;
    this.highlightedElements = [];
    this.neighbors = [];
    this.realNeighbors = [];
    this.doubleClick = new DoubleClick();
    // this.clicked = {wasClicked: false};
    this.updateData = {wasUpdated: false};
    this.d3Tooltip = new d3Tooltip(HTMLelement);
    this.d3Tooltip.created3Tooltip();
    this.nLevels = numOfLevels;
    this.userInfo = undefined;
    /** Counts number of edges to be created while showing parents */
    this.nEdges = 0;
    /** Object to handle statistics processing and visualization */
    this.statsHandler = new statsHandler(SVGId, d3WordCloudId);
    this.SVGId = SVGId;
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
 * Getter for number of levels.
 * @public
 * @returns {int} Number of levels.
 */
EventHandler.prototype.getNLevels = function()
{
  return this.nLevels;
}

/**
 * Setter for number of levels.
 * @param {int} numOfLevels Number of levels.
 */
EventHandler.prototype.setNLevels = function(numOfLevels)
{
  this.nLevels = numOfLevels;
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
 * Get color based on d3's linear scale function.
 * @param {float} value Value to apply feature scaling.
 * @param {float} maxValue Maximum value.
 * @param {float} minValue Minimum value.
 * @param {String} color Base color, being either red ('r'), green ('g') or blue ('b').
 */
EventHandler.prototype.getColor = function(value, maxValue, minValue, color)
{
  var minColor = maxColor = '';
  /** Assign colors */
  switch(color)
  {
    case 'r':
      minColor = 'rgb(255, 105, 0)';
      maxColor = 'rgb(255, 0, 0)';
    break;
    case 'g':
      minColor = 'rgb(200, 255, 0)';
      maxColor = 'rgb(0, 255, 0)';
    break;
    /** Assuming default as blue */
    default:
      minColor = 'rgb(220, 255, 255)';
      maxColor = 'rgb(0, 0, 255)';
    break;
  }
  /** Create linear scale */
  var linearScale = d3.scaleLinear().domain([minValue, maxValue]).range([minColor, maxColor]);
  // var linearScale = d3.scaleLinear().domain([maxValue, minValue]).range([maxColor, minColor]);
  /** Return feature scaling of value */
  return linearScale(value);
}

/**
 * Render specific edges between source and neighbors. Non-optimal.
 * @public
 * @param {Object} scene Scene to add edges.
 * @param {Object} mesh Mesh for neighbors.
 * @param {Object} neighbors Source node, containing 'neighbors' attribute.
 */
EventHandler.prototype.renderNeighborEdges = function(scene, mesh, neighbors)
{
  var edgeGeometry = new THREE.Geometry();
  var sourceNode = neighbors.neighbors[0];
  var sourcePos = mesh.geometry.faces[sourceNode*32].position;
  var edgeColor = [];
  var eventHandlerScope = this;
  /** Store edge color according to weight */
  $.ajax({
    url: '/graph/getEdgesWeights',
    type: 'POST',
    // data: { source: mesh.geometry.faces[sourceNode*32].id, target: mesh.geometry.faces[neighbors.neighbors[i]*32].id },
    data: { neighbors: neighbors.neighbors },
    success: function(html){
      html = JSON.parse(html);
      for(var i = 1; i < neighbors.neighbors.length; i++)
      {
        /** Fetch positions from mesh */
        var targetPos = mesh.geometry.faces[neighbors.neighbors[i]*32].position;
        var v1 = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
        var v2 = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
        edgeGeometry.vertices.push(v1);
        edgeGeometry.vertices.push(v2);
      }
      for(var i = 0, j = 0; i < edgeGeometry.vertices.length && j < neighbors.neighbors.length; i = i + 2, j = j + 1)
      {
        // edgeGeometry.colors[i] = new THREE.Color('rgb(0, 0, 255)');
        edgeGeometry.colors[i] = new THREE.Color(eventHandlerScope.getColor(html.edges[j], html.minEdgeWeight, html.maxEdgeWeight, 'b'));
        // edgeGeometry.colors[i] = new THREE.Color();
        edgeGeometry.colors[i+1] = edgeGeometry.colors[i];
      }
      edgeGeometry.colorsNeedUpdate = true;

      /** Create one LineSegments and add it to scene */
      var edgeMaterial = new THREE.LineBasicMaterial({vertexColors:  THREE.VertexColors});
      var lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial, THREE.LinePieces);
      lineSegments.name = "neighborEdges";
      scene.add(lineSegments);

      edgeGeometry.dispose();
      edgeGeometry = null;
      edgeMaterial.dispose();
      edgeMaterial = null;
    },
    xhr: loadGraph
  });
}

/**
 * Set translation, rotation and scaling factors for a given geometry.
 * @param {Object} geometry Three.js Geometry structure to apply operations.
 * @param {Array} tFactor Translation factor, given by (x,y,z) coordinates.
 * @param {Array} rFactor Rotation factor, given by (rx, ry, rz) values.
 * @param {Array} sFactor Scale factor, given by (sx, sy, sz) values.
 * @param {Array} order Set order of operations to be executed; (1) for translate, (2) for rotate and (3) for scale.
 */
EventHandler.prototype.setTRS = function(geometry, tFactor, rFactor, sFactor, order)
{
  if(order == undefined) order = [1, 2, 3];
  for(o in order)
  {
    switch(order[o])
    {
      case 1:
        if(tFactor != undefined) geometry.translate(tFactor[0], tFactor[1], tFactor[2]);
      break;
      case 2:
        if(rFactor != undefined) geometry.rotate(rFactor[0], rFactor[1], rFactor[2]);
      break;
      case 3:
        if(sFactor != undefined) geometry.scale(sFactor[0], sFactor[1], sFactor[2]);
      break;
      default:
      break;
    }
  }
}

/**
 * Color vertex.
 * @param {Array} faces Array of faces objects.
 * @param {int} startFace Index for starting face.
 * @param {int} endFace Index for end of face.
 * @param {Array} color Array of color.
 */
EventHandler.prototype.colorVertex = function(faces, startFace, endFace, color)
{
  for(var i = startFace; i < endFace; i++)
  {
    // faces[i].color.setRGB(color[0], color[1], color[2]);
    color === undefined ? faces[i].color.setRGB(faces[i].color.r+0.3, faces[i].color.g+0.3, faces[i].color.b+0.3) : faces[i].color.setRGB(color[0], color[1], color[2]);
  }
}

/**
 * Change neighbor vertexes colors.
 * @param {Object} scene Scene for raycaster.
 * @param {Array} faces Array of faces objects.
 * @param {Array} neighbors Neighbors to be colored.
 */
EventHandler.prototype.colorNeighbors = function(scene, faces, neighbors)
{
  /** First element of 'neighbors' array is double-clicked vertex */
  for(var i = 2; i < neighbors.length; i++)
  {
    var endPoint = ((faces[neighbors[0].vertexInfo].neighbors[i]) * 32) + 32;
    this.colorVertex(faces, faces[neighbors[0].vertexInfo].neighbors[i]*32, endPoint, undefined);
    /** Create blue circle for highlighting */
    var circleGeometry = new THREE.CircleGeometry(1, 32);
    this.colorVertex(circleGeometry.faces, 0, 32, Array(0.0, 0.0, 1.0));
    this.setTRS(circleGeometry, [parseFloat(faces[neighbors[i].vertexInfo*32].position.x), parseFloat(faces[neighbors[i].vertexInfo*32].position.y), parseFloat(faces[neighbors[i].vertexInfo*32].position.z)], undefined, [parseFloat(faces[neighbors[i].vertexInfo*32].size)+1, parseFloat(faces[neighbors[i].vertexInfo*32].size)+1, 1], [3, 1, 2]);
    /** Creating material for nodes */
    var material = new THREE.MeshLambertMaterial( {  wireframe: false, vertexColors:  THREE.FaceColors } );
    /** Create one mesh from single geometry and add it to scene */
    var mesh = new THREE.Mesh(circleGeometry, material);
    mesh.name = "neighbor" + scene.children.length.toString();
    /** Alter render order so that node mesh will always be drawn on top of edges */
    mesh.renderOrder = 0;
    scene.add(mesh);
  }
}

/**
 * Show coarsened graph neighbors when double clicked.
 * @param {Object} scene Scene for raycaster.
 */
EventHandler.prototype.showNeighbors = function(scene)
{
  var element = scene.getObjectByName("MainMesh", true);
  /** Find highlighted vertex and highlight its neighbors */
  for(var i = 0; i < this.highlightedElements.length; i++)
  {
    /** Add itself for highlighting */
    this.neighbors.push({vertexInfo: this.highlightedElements[i]/32, mesh: element.name, edgeColor: {r:0, g:0, b:0}});
    this.realNeighbors.push({vertexInfo: this.highlightedElements[i]/32, mesh: element.name, edgeColor: {r:0, g:0, b:0}});
    for(var j = 1; j < element.geometry.faces[this.highlightedElements[i]].neighbors.length; j++)
    {
      this.neighbors.push({vertexInfo: element.geometry.faces[this.highlightedElements[i]].neighbors[j], mesh: element.name, edgeColor: {r:0, g:0, b:0}});
      this.realNeighbors.push({vertexInfo: element.geometry.faces[this.highlightedElements[i]].neighbors[j], mesh: element.name, edgeColor: {r:0, g:0, b:0}});
    }
    this.renderNeighborEdges(scene, element, element.geometry.faces[this.highlightedElements[i]]);
    this.colorNeighbors(scene, element.geometry.faces, this.neighbors);
    element.geometry.colorsNeedUpdate = true;
    element.geometry.verticesNeedUpdate = true;
    /** Remove itself so it won't unhighlight as soon as mouse moves out */
    this.highlightedElements.splice(i, 1);
  }
}

/**
 * Check to see if a vertex has been rendered. Checking is made by comparing either y or x axis.
 * @param {Object} sourcePos Coordinates (x,y,z) from clicked vertex.
 * @param {Object} targetPos Coordinates (x,y,z) from parent vertex.
 * @param {int} layout Graph layout.
 * @return {int} (1) if both vertexes were rendered; (0) if only clicked vertex was rendered.
 */
EventHandler.prototype.wasRendered = function(sourcePos, targetPos, layout)
{
  /** Graph is displayed vertically; must compare x-axes */
  if(layout == 2)
  {
    // return Math.abs(targetPos.y) > Math.abs(sourcePos.y) ? 1 : 0;
    return ( (targetPos.y < 0 && sourcePos.y < 0) || (targetPos.y > 0 && sourcePos.y > 0) ) ? 1 : 0;
  }
  else if(layout == 3)
  {
    // return Math.abs(targetPos.x) > Math.abs(sourcePos.x) ? 1 : 0;
    return ( (targetPos.x < 0 && sourcePos.x < 0) || (targetPos.x > 0 && sourcePos.x > 0) ) ? 1 : 0;
  }
}

/**
 * Show merged vertexes from a given node.
 * @param {int} nEdges Number of edges created, constantly updated through recursion.
 * @param {Object} scene Scene for raycaster.
 * @param {int} startFace Face index from a given node.
 * @param {Object} currentMesh Mesh where current node is.
 * @param {Object} previousMesh Mesh where parent nodes are.
 * @param {int} previousMeshNumber Mesh number where parent nodes are.
 * @param {int} layout Graph layout.
 * @param {int} layer Checks whether vertex double-clicked belongs to first layer or last layer.
 */
EventHandler.prototype.showNodeParents = function(nEdges, scene, startFace, currentMesh, previousMesh, previousMeshNumber, layout, layer)
{
  /** Recursion termination condition */
  if(previousMesh != undefined && previousMesh.name != currentMesh.name)
  {
    var properties = JSON.parse(currentMesh.geometry.faces[startFace].properties);
    var edgeGeometry = new THREE.Geometry();
    var sourcePos = currentMesh.geometry.faces[startFace].position;
    var v1 = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
    // var predecessors;
    // /** Color predecessors */
    // for(pred in properties)
    // {
    //   if(pred == "predecessor")
    //   {
    //     predecessors = properties[pred].split(",");
    //   }
    // }
    var l = 0;
    if(!isNaN(currentMesh.name[currentMesh.name.length-1]))
    {
      l = parseInt(currentMesh.name[currentMesh.name.length-1]);
    }
    var layScope = this;
    $.ajax({
      url: '/graph/getSorted',
      type: 'POST',
      /** FIXME - NEVER EVER EVER use async! */
      async: false,
      // data: { name: previousMesh.name, pred: predecessors },
      data: { currentMesh: currentMesh.name, previousMesh: previousMesh.name, levels: l, idx: JSON.parse(currentMesh.geometry.faces[startFace].properties).id },
      success: function(data){
        data = JSON.parse(data);
        for(var i = 0; i < data.array.length; i++)
        {
          data.array[i] = parseInt(data.array[i])*32;
          /** Check which layer double-clicked vertex belongs to */
          // var vertexId = JSON.parse(currentMesh.geometry.faces[startFace].properties).id;
          // /** If from first, do nothing; else if from last, update index */
          // if(vertexId >= currentMesh.geometry.faces[startFace].firstLayer)
          // {
          //   console.log("entered if");
          //   data.array[i] = data.array[i] - (parseInt(JSON.parse(currentMesh.geometry.faces[startFace].properties).firstLayer)*32);
          // }
          // /** FIXME - Access to index '0' is hardcoded */
          // var layers = JSON.parse(previousMesh.geometry.faces[(parseInt(data.array[i]))].layers);
          // /** First layer isn't rendered; update predecessor ids so that it searches for proper parents */
          // if(layers.renderFirstLayer == false && layers.renderLastLayer == true)
          // {
          //   /** FIXME - Access to index '0' is hardcoded */
          //   data.array[i] = data.array[i] - (parseInt(previousMesh.geometry.faces[0].firstLayer)*32);
          //   // data.array[i] = data.array[i] - (parseInt(previousMesh.geometry.faces[(parseInt(data.array[i]))].firstLayer)*32);
          // }
          if(previousMesh.geometry.faces[(parseInt(data.array[i]))] === undefined)
          {
              data.array[i] = data.array[i] - (parseInt(previousMesh.geometry.faces[0].firstLayer)*32);
          }
          /** Color predecessors */
          var targetPos = previousMesh.geometry.faces[(parseInt(data.array[i]))].position;
          /** Check if predecessor vertexes were rendered */
          // if(layScope.wasRendered(sourcePos, targetPos, layout))
          // {
          layScope.neighbors.push({vertexInfo: parseInt(data.array[i]), mesh: previousMesh.name});
          var v2 = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
          for(var j = 0; j < 32; j++)
          {
            // previousMesh.geometry.faces[(parseInt(data.array[i])) + j].color.setRGB(0.0, 1.0, 0.0);
            previousMesh.geometry.faces[(parseInt(data.array[i])) + j].color.setRGB(previousMesh.geometry.faces[(parseInt(data.array[i])) + j].color.r+0.3, previousMesh.geometry.faces[(parseInt(data.array[i])) + j].color.g+0.3, previousMesh.geometry.faces[(parseInt(data.array[i])) + j].color.b+0.3);
          }
          /** Draw green circle behind predecessors as borders to predecessor vertices */
          var circleGeometry = new THREE.CircleGeometry(1, 32);
          layScope.colorVertex(circleGeometry.faces, 0, 32, Array(0.0, 1.0, 0.0));
          layScope.setTRS(circleGeometry, [parseFloat(previousMesh.geometry.faces[(parseInt(data.array[i]))].position.x), parseFloat(previousMesh.geometry.faces[(parseInt(data.array[i]))].position.y), parseFloat(previousMesh.geometry.faces[(parseInt(data.array[i]))].position.z)], undefined, [parseFloat(previousMesh.geometry.faces[(parseInt(data.array[i]))].size)+1, parseFloat(previousMesh.geometry.faces[(parseInt(data.array[i]))].size)+1, 1], [3, 1, 2]);
          /** Creating material for nodes */
          var material = new THREE.MeshLambertMaterial( {  wireframe: false, vertexColors:  THREE.FaceColors } );
          /** Create one mesh from single geometry and add it to scene */
          var mesh = new THREE.Mesh(circleGeometry, material);
          mesh.name = "predecessor" + scene.children.length.toString();
          /** Alter render order so that node mesh will always be drawn on top of edges */
          mesh.renderOrder = 0;
          scene.add(mesh);
          circleGeometry.dispose();
          circleGeometry = null;
          material.dispose();
          material = null;
          /** Add edges to 'parentConnections' geometry */
          edgeGeometry.vertices.push(v1);
          edgeGeometry.vertices.push(v2);
          // }
          // if(previousMesh.geometry.faces[(parseInt(data.array[i]))] !== undefined)
          // {
          // }
        }
        previousMesh.geometry.colorsNeedUpdate = true;
        for(var i = 0; i < edgeGeometry.vertices.length; i = i + 2)
        {
          // edgeGeometry.colors[i] = new THREE.Color("rgb(255, 0, 0)");
          edgeGeometry.colors[i] = new THREE.Color("rgb(0, 255, 0)");
          edgeGeometry.colors[i+1] = edgeGeometry.colors[i];
        }
        edgeGeometry.computeLineDistances();
        edgeGeometry.colorsNeedUpdate = true;

        /** Create one LineSegments and add it to scene */
        // var edgeMaterial = new THREE.LineBasicMaterial({vertexColors:  THREE.VertexColors});
        var edgeMaterial = new THREE.LineDashedMaterial({vertexColors:  THREE.VertexColors, dashSize: 10, gapSize: 3});
        var lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial, THREE.LinePieces);
        // lineSegments.name = isNaN(currentMesh.name[currentMesh.name.length-1]) ? "parentConnections" : "parentConnections" + currentMesh.name[currentMesh.name.length-1];
        lineSegments.name = "parentConnections" + layScope.nEdges;
        // console.log("lineSegments.name: " + lineSegments.name);
        layScope.nEdges = layScope.nEdges + 1;
        scene.add(lineSegments);

        edgeGeometry.dispose();
        edgeGeometry = null;
        edgeMaterial.dispose();
        edgeMaterial = null;

        /** Check if there are previous meshes */
        var previousMeshNumber = previousMesh.name[previousMesh.name.length-1];
        if(parseInt(previousMeshNumber) == (layScope.nLevels[layer]+1))
        {
          previousMeshNumber = -1;
        }
        else
        {
          previousMeshNumber = parseInt(previousMeshNumber);
          previousMeshNumber = previousMeshNumber + 1;
        }

        /** Recursively highlight parents */
        for(var i = 0; i < data.array.length; i++)
        {
          if(previousMesh.geometry.faces[(parseInt(data.array[i]))] !== undefined)
          {
              layScope.showNodeParents(layScope.nEdges, scene, parseInt(data.array[i]), previousMesh, previousMeshNumber == -1 ? undefined : scene.getObjectByName("MainMesh" + previousMeshNumber), previousMeshNumber, layout, layer);
          }
          // layScope.showNodeParents(scene, parseInt(data.array[i]), previousMesh, previousMeshNumber == 0 ? scene.getObjectByName("MainMesh") : previousMeshNumber == -1 ? undefined : scene.getObjectByName("MainMesh" + previousMeshNumber), layout);
        }
      },
      xhr: loadGraph
    });
  }
  /** If true, it means there are still meshes to search for parents; they are not exactly one level before or after */
  else if(previousMesh == undefined && parseInt(previousMeshNumber) > 0 && parseInt(previousMeshNumber) <= (this.nLevels[layer]+1))
  {
    previousMeshNumber = parseInt(previousMeshNumber);
    previousMeshNumber = previousMeshNumber + 1;
    this.showNodeParents(this.nEdges, scene, startFace, currentMesh, previousMeshNumber == -1 ? undefined : scene.getObjectByName("MainMesh" + previousMeshNumber), previousMeshNumber, layout, layer);
  }
  // else
  // {
  //   this.clicked.wasClicked = true;
  // }
}

/**
 * Show merged vertexes which formed super vertex clicked.
 * @param {Object} intersection Intersected object in specified scene.
 * @param {Object} scene Scene for raycaster.
 * @param {int} layout Graph layout.
 */
EventHandler.prototype.showParents = function(intersection, scene, layout)
{
  if(intersection !== undefined)
  {
    this.clicked.wasClicked = true;
    var previousMeshNumber = parseInt(intersection.object.name[intersection.object.name.length-1]) + 1;
    var originalMeshName = intersection.object.name.substring(0, intersection.object.name.length-1);
    if(isNaN(previousMeshNumber)) previousMeshNumber = "h1";
    // var currentMesh = scene.getObjectByName(intersection.object.name);
    var previousMesh = scene.getObjectByName(originalMeshName + previousMeshNumber.toString());
    if(previousMesh != undefined)
    {
      /** Get array of predecessors */
      var startFace = intersection.faceIndex-(intersection.face.a-intersection.face.c)+1;
      /** Recursively highlight parent nodes */
      this.showNodeParents(this.nEdges, scene, startFace, intersection.object, previousMesh, layout);
    }
    /** Recursively highlight parents */
    // if(previousMeshNumber != 'h1')
    //
    // else
    //   this.clicked.wasClicked = true;

  }
  else
  {
    this.clicked.wasClicked = false;
    for(var i = 0; i < this.nEdges; i++)
    {
      // console.log("parentConnections" + i.toString());
      scene.remove(scene.getObjectByName("parentConnections" + i.toString()));
    }
    this.nEdges = 0;
    // for(var i = 0; i < this.nLevels; i++)
    // {
    //   if(i == 0)
    //   {
    //     console.log("entrei em parentConnections");
    //     scene.remove(scene.getObjectByName("parentConnections"));
    //   }
    //   else
    //   {
    //     console.log("parentConnections"+i.toString());
    //     scene.remove(scene.getObjectByName("parentConnections"+i.toString()));
    //   }
    //   // i == 0 ? scene.remove(scene.getObjectByName("parentConnections")) : scene.remove(scene.getObjectByName("parentConnections"+i.toString()));
    // }
    for(var i = 0; i < this.neighbors.length; i++)
    {
      var mesh = scene.getObjectByName(this.neighbors[i].mesh);
      for(var j = 0; j < 32; j++)
      {
        if(mesh.geometry.faces[(this.neighbors[i].vertexInfo*32)+j] !== undefined)
        {
            mesh.geometry.faces[(this.neighbors[i].vertexInfo*32)+j].color.setRGB(0.0, 0.0, 0.0);
        }
        else if(mesh.geometry.faces[(this.neighbors[i].vertexInfo)+j] !== undefined)
        {
          mesh.geometry.faces[(this.neighbors[i].vertexInfo)+j].color.setRGB(0.0, 0.0, 0.0);
        }
        mesh.geometry.colorsNeedUpdate = true;
      }
    }
    /** Clearing array of neighbors */
    this.neighbors = [];
  }
}

/**
 * Show merged vertexes from a given node.
 * @param {int} nEdges Number of edges created, constantly updated through recursion.
 * @param {Object} scene Scene for raycaster.
 * @param {int} startFace Face index from a given node.
 * @param {Object} currentMesh Mesh where current node is.
 * @param {Object} nextMesh Mesh where successor nodes are.
 * @param {int} nextMeshNumber Mesh number where successor nodes are.
 * @param {int} layout Graph layout.
 * @param {int} layer Checks whether vertex double-clicked belongs to first layer or last layer.
 * @return {int} Index of last successor in layout.
 */
EventHandler.prototype.showNodeChildren = function(nEdges, scene, startFace, currentMesh, nextMesh, nextMeshNumber, layout, layer)
{
  var lastSuc = undefined;
  /** Recursion termination condition */
  if(nextMesh != undefined && nextMesh.name != currentMesh.name)
  {
    // var properties = JSON.parse(currentMesh.geometry.faces[startFace].properties);
    var edgeGeometry = new THREE.Geometry();
    var sourcePos = currentMesh.geometry.faces[startFace].position;
    var v1 = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
    // var successors = undefined;
    // /** Color successors */
    // for(suc in properties)
    // {
    //   if(suc == "successor")
    //   {
    //     successors = properties[suc].split(",");
    //   }
    // }
    var l = 0;
    if(!isNaN(currentMesh.name[currentMesh.name.length-1]))
    {
      l = parseInt(currentMesh.name[currentMesh.name.length-1]);
    }
    var layScope = this;
    $.ajax({
      url: '/graph/getSortedSuccessors',
      type: 'POST',
      /** FIXME - NEVER EVER EVER use async! */
      async: false,
      data: { currentMesh: currentMesh.name, nextMesh: nextMesh.name, levels: l, idx: JSON.parse(currentMesh.geometry.faces[startFace].properties).id },
      success: function(data){
        data = JSON.parse(data);
        for(var i = 0; nextMesh.geometry.faces[(parseInt(data.array[i]))] != undefined && i < data.array.length; i++)
        {
          data.array[i] = (parseInt(data.array[i]))*32;
          // if(JSON.parse(nextMesh.geometry.faces[(parseInt(data.array[i]))].layers).renderFirstLayer == false)
          if(nextMesh.geometry.faces[(parseInt(data.array[i]))] == undefined)
          {
            data.array[i] = data.array[i] - (parseInt(nextMesh.geometry.faces[0].firstLayer)*32);
          }
          /** Color successors */
          var targetPos = nextMesh.geometry.faces[(parseInt(data.array[i]))].position;
          layScope.neighbors.push({vertexInfo: parseInt(data.array[i]), mesh: nextMesh.name});
          var v2 = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
          for(var j = 0; j < 32; j++)
          {
            // nextMesh.geometry.faces[(parseInt(data.array[i])) + j].color.setRGB(0.0, 1.0, 0.0);
            nextMesh.geometry.faces[(parseInt(data.array[i])) + j].color.setRGB(nextMesh.geometry.faces[(parseInt(data.array[i])) + j].color.r+0.3, nextMesh.geometry.faces[(parseInt(data.array[i])) + j].color.g+0.3, nextMesh.geometry.faces[(parseInt(data.array[i])) + j].color.b+0.3);
          }
          /** Add edges to 'parentConnections' geometry */
          edgeGeometry.vertices.push(v1);
          edgeGeometry.vertices.push(v2);
          /** Draw green circle behind successor as borders to successor */
          var circleGeometry = new THREE.CircleGeometry(1, 32);
          layScope.colorVertex(circleGeometry.faces, 0, 32, Array(0.0, 1.0, 0.0));
          layScope.setTRS(circleGeometry, [parseFloat(nextMesh.geometry.faces[(parseInt(data.array[i]))].position.x), parseFloat(nextMesh.geometry.faces[(parseInt(data.array[i]))].position.y), parseFloat(nextMesh.geometry.faces[(parseInt(data.array[i]))].position.z)], undefined, [parseFloat(nextMesh.geometry.faces[(parseInt(data.array[i]))].size)+1, parseFloat(nextMesh.geometry.faces[(parseInt(data.array[i]))].size)+1, 1], [3, 1, 2]);
          /** Creating material for nodes */
          var material = new THREE.MeshLambertMaterial( {  wireframe: false, vertexColors:  THREE.FaceColors } );
          /** Create one mesh from single geometry and add it to scene */
          var mesh = new THREE.Mesh(circleGeometry, material);
          mesh.name = "successor" + scene.children.length.toString();
          /** Alter render order so that node mesh will always be drawn on top of edges */
          mesh.renderOrder = 0;
          scene.add(mesh);
          circleGeometry.dispose();
          circleGeometry = null;
          material.dispose();
          material = null;
        }
        nextMesh.geometry.colorsNeedUpdate = true;
        for(var i = 0; i < edgeGeometry.vertices.length; i = i + 2)
        {
          // edgeGeometry.colors[i] = new THREE.Color("rgb(255, 0, 0)");
          edgeGeometry.colors[i] = new THREE.Color("rgb(0, 255, 0)");
          edgeGeometry.colors[i+1] = edgeGeometry.colors[i];
        }
        edgeGeometry.computeLineDistances();
        edgeGeometry.colorsNeedUpdate = true;

        /** Create one LineSegments and add it to scene */
        // var edgeMaterial = new THREE.LineBasicMaterial({vertexColors:  THREE.VertexColors});
        var edgeMaterial = new THREE.LineDashedMaterial({vertexColors:  THREE.VertexColors, dashSize: 10, gapSize: 3});
        var lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial, THREE.LinePieces);
        // lineSegments.name = isNaN(currentMesh.name[currentMesh.name.length-1]) ? "parentConnections" : "parentConnections" + currentMesh.name[currentMesh.name.length-1];
        lineSegments.name = "parentConnections" + layScope.nEdges;
        // console.log("lineSegments.name: " + lineSegments.name);
        layScope.nEdges = layScope.nEdges + 1;
        scene.add(lineSegments);

        edgeGeometry.dispose();
        edgeGeometry = null;
        edgeMaterial.dispose();
        edgeMaterial = null;

        /** Check if there are next meshes */
        var nextMeshNumber = nextMesh.name[nextMesh.name.length-1];
        if(isNaN(nextMeshNumber))
        {
          nextMeshNumber = -1;
        }
        else
        {
          nextMeshNumber = parseInt(nextMeshNumber);
          nextMeshNumber = nextMeshNumber - 1;
        }
        /** Recursively highlight children */
        for(var i = 0; i < data.array.length; i++)
        {
          lastSuc = layScope.showNodeChildren(this.nEdges, scene, parseInt(data.array[i]), nextMesh, nextMeshNumber == -1 ? undefined : nextMeshNumber == 0 ? scene.getObjectByName("MainMesh") : scene.getObjectByName("MainMesh" + nextMeshNumber), nextMeshNumber, layout, layer);
          // this.showNodeParents(scene, parseInt(data.array[i]), nextMesh, nextMeshNumber == 0 ? scene.getObjectByName("MainMesh") : nextMeshNumber == -1 ? undefined : scene.getObjectByName("MainMesh" + nextMeshNumber), layout);
        }
      },
      xhr: loadGraph
    });
    // for(var i = 0; successors != undefined && i < successors.length; i++)
    // {
    //   successors[i] = parseInt(successors[i])*32;
    //   if(nextMesh.geometry.faces[(parseInt(successors[i]))] !== undefined)
    //   {
    //     var layers = JSON.parse(nextMesh.geometry.faces[(parseInt(successors[i]))].layers);
    //     /** First layer isn't rendered; update successor ids so that it searches for proper parents */
    //     // if(layers.renderFirstLayer == false && layers.renderLastLayer == true)
    //     // {
    //     //   successors[i] = successors[i] + (parseInt(nextMesh.geometry.faces[(parseInt(successors[i]))].firstLayer)*32);
    //     // }
    //     /** Color predecessors */
    //     var targetPos = nextMesh.geometry.faces[(parseInt(successors[i]))].position;
    //     /** Check if predecessor vertexes were rendered */
    //     // if(this.wasRendered(sourcePos, targetPos, layout))
    //     // {
    //       this.neighbors.push({vertexInfo: parseInt(successors[i]), mesh: nextMesh.name});
    //       var v2 = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
    //       for(var j = 0; j < 32; j++)
    //       {
    //         nextMesh.geometry.faces[(parseInt(successors[i])) + j].color.setRGB(1.0, 0.0, 0.0);
    //       }
    //       /** Add edges to 'parentConnections' geometry */
    //       edgeGeometry.vertices.push(v1);
    //       edgeGeometry.vertices.push(v2);
    //     // }
    //   }
    // }
    // nextMesh.geometry.colorsNeedUpdate = true;
    // for(var i = 0; i < edgeGeometry.vertices.length; i = i + 2)
    // {
    //   edgeGeometry.colors[i] = new THREE.Color("rgb(255, 0, 0)");
    //   edgeGeometry.colors[i+1] = edgeGeometry.colors[i];
    // }
    // edgeGeometry.colorsNeedUpdate = true;
    //
    // /** Create one LineSegments and add it to scene */
    // var edgeMaterial = new THREE.LineBasicMaterial({vertexColors:  THREE.VertexColors});
    // var lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial, THREE.LinePieces);
    // // lineSegments.name = isNaN(currentMesh.name[currentMesh.name.length-1]) ? "parentConnections" : "parentConnections" + currentMesh.name[currentMesh.name.length-1];
    // lineSegments.name = "parentConnections" + this.nEdges;
    // // console.log("lineSegments.name: " + lineSegments.name);
    // this.nEdges = this.nEdges + 1;
    // scene.add(lineSegments);
    //
    // edgeGeometry.dispose();
    // edgeGeometry = null;
    // edgeMaterial.dispose();
    // edgeMaterial = null;
    //
    // /** Check if there are next meshes */
    // var nextMeshNumber = nextMesh.name[nextMesh.name.length-1];
    // // if(parseInt(nextMeshNumber) == 1)
    // if(isNaN(nextMeshNumber))
    // {
    //   nextMeshNumber = -1;
    // }
    // else
    // {
    //   nextMeshNumber = parseInt(nextMeshNumber);
    //   nextMeshNumber = nextMeshNumber - 1;
    // }
    //
    // /** Recursively highlight children */
    // for(var i = 0; successors != undefined && i < successors.length; i++)
    // {
    //   return this.showNodeChildren(this.nEdges, scene, parseInt(successors[i]), nextMesh, nextMeshNumber == -1 ? undefined : nextMeshNumber == 0 ? scene.getObjectByName("MainMesh") : scene.getObjectByName("MainMesh" + nextMeshNumber), nextMeshNumber, layout, layer);
    //   // this.showNodeParents(scene, parseInt(data.array[i]), nextMesh, nextMeshNumber == 0 ? scene.getObjectByName("MainMesh") : nextMeshNumber == -1 ? undefined : scene.getObjectByName("MainMesh" + nextMeshNumber), layout);
    // }
  }
  /** If true, it means there are still meshes to search for children; they are not exactly one level before or after */
  else if(nextMesh == undefined && parseInt(nextMeshNumber) >= 0)
  {
    nextMeshNumber = parseInt(nextMeshNumber);
    nextMeshNumber = nextMeshNumber - 1;
    lastSuc = this.showNodeChildren(this.nEdges, scene, startFace, currentMesh, nextMeshNumber == -1 ? undefined : nextMeshNumber == 0 ? scene.getObjectByName("MainMesh") : scene.getObjectByName("MainMesh" + nextMeshNumber), nextMeshNumber, layout, layer);
  }
  if(lastSuc == undefined)
  {
    return startFace;
  }
  else
  {
    return lastSuc;
  }
}

/**
 * Show vertex information with Vue.js.
 * @public
 * @param {JSON} vertices Properties from vertex face.
 * @param {Array} rows Rows to insert data.
 * @param {String} table Table ID where vertex info will be displayed.
 */
EventHandler.prototype.showVertexInfo = function(vertices, header, rows, table)
{
  var vertexVueHeaders = [], vertexVueRows = [], valuesOfVertex;
  /** Load already existing elements clicked in array of rows */
  // for(var j = 0; j < rows.length; j++)
  // {
  //   vertexVueRows.push(rows[j]);
  // }
  /** If object does not contain an array of vertexes, then its a vertex with no coarsening */
  if(vertices.vertexes !== undefined)
  {
    vertices = vertices.vertexes;
  }
  else
  {
    var simpleArr = [];
    simpleArr.push(vertices);
    vertices = simpleArr;
  }
  /** Check if intersected vertex is either from first or second layer */
  for(var j = 0; j < vertices.length; j++)
  {
    var tempArr = [];
    for(key in vertices[j])
    {
      if(key != "sha-id" && key != "id") tempArr.push(key);
    }
    if(vertexVueHeaders.length < tempArr.length)
    {
      vertexVueHeaders = tempArr;
      /** Sort headers */
      vertexVueHeaders.sort(function(a, b){
        return ('' + a).localeCompare(b);
      });
      /** Construct a new vue table header */
      // header.push(vertexVueHeaders);
      if(header.length == 0)
      {
        vertexVueHeaders.forEach(function(element){
          header.push(element);
        });
      }
    }
  }
  for(var j = 0; j < vertices.length; j++)
  {
    var ordered = {};
    for(key in vertexVueHeaders)
    {
      if(!(vertexVueHeaders[key] in vertices[j]))
      {
        ordered[vertexVueHeaders[key]] = "No value";
      }
      else
      {
        ordered[vertexVueHeaders[key]] = vertices[j][vertexVueHeaders[key]];
      }
    }
    // vertexVueRows.push(ordered);
    rows.push(ordered);
  }
  /** Construct a new vue table data */
  // rows.push(vertexVueRows);
  // for(var i = 0; i < vertexVueRows.length; i++)
  // {
  //   rows.push(vertexVueRows[i]);
  // }
  // vertexVueRows.forEach(function(element){
  //   rows.push(element);
  // });
  /** Show tables containing vertex info */
  $(table).css('visibility', 'visible');
}

/**
 * Show neighbor vertexes from selected element information.
 * @param {Object} scene Scene for raycaster.
 */
EventHandler.prototype.showNeighborInfo = function(scene)
{
  var mesh = scene.getObjectByName("MainMesh");
  for(let i = 0; i < this.realNeighbors.length; i++)
  {
    /** Show vertex info for every neighbor found */
    parseInt(JSON.parse(mesh.geometry.faces[this.realNeighbors[i].vertexInfo*32].properties).id) < parseInt(mesh.geometry.faces[this.realNeighbors[i].vertexInfo*32].firstLayer) ? this.showVertexInfo(JSON.parse(mesh.geometry.faces[this.realNeighbors[i].vertexInfo*32].properties), vueRootInstance.$data.tableCards[0].headers, vueRootInstance.$data.tableCards[0].rows, "#divVertexInfoTable") : this.showVertexInfo(JSON.parse(mesh.geometry.faces[this.realNeighbors[i].vertexInfo*32].properties), vueRootInstance.$data.tableCards[1].headers, vueRootInstance.$data.tableCards[1].rows, "#divVertexInfoTableSecondLayer");
    // parseInt(JSON.parse(mesh.geometry.faces[this.realNeighbors[i].vertexInfo*32].properties).id) < parseInt(mesh.geometry.faces[this.realNeighbors[i].vertexInfo*32].firstLayer) ? this.showVertexInfo(JSON.parse(mesh.geometry.faces[this.realNeighbors[i].vertexInfo*32].properties), vueTableHeader, vueTableRows, "#divVertexInfoTable") : this.showVertexInfo(JSON.parse(mesh.geometry.faces[this.realNeighbors[i].vertexInfo*32].properties), vueTableHeaderSecondLayer, vueTableRowsSecondLayer, "#divVertexInfoTableSecondLayer");
    // mesh.geometry.faces[this.realNeighbors[i].vertexInfo].faceIndex <= mesh.geometry.faces[this.realNeighbors[i].vertexInfo].firstLayer*32 ? this.showVertexInfo(JSON.parse(mesh.geometry.faces[this.realNeighbors[i].vertexInfo].properties), vueTableRows, "#divVertexInfoTable") : this.showVertexInfo(JSON.parse(mesh.geometry.faces[this.realNeighbors[i].vertexInfo].properties), vueTableRowsSecondLayer, "#divVertexInfoTableSecondLayer");
  }
}

/**
 * Show both parents and children of a given node, highlighting vertexes and creating edges.
 * @param {Object} intersection Intersected object in specified scene.
 * @param {Object} scene Scene for raycaster.
 * @param {int} layout Graph layout.
 * @param {int} layer Checks whether vertex double-clicked belongs to first layer or last layer.
 */
EventHandler.prototype.showHierarchy = function(intersection, scene, layout, layer)
{
  if(intersection !== undefined)
  {
    var index = '';
    var previousMeshNumber = parseInt(intersection.object.name[intersection.object.name.length-1]) + 1;
    var nextMeshNumber = parseInt(intersection.object.name[intersection.object.name.length-1]) - 1;
    var originalMeshName = intersection.object.name.substring(0, intersection.object.name.length-1);
    if(isNaN(previousMeshNumber) || parseInt(previousMeshNumber) == 0)
    {
      originalMeshName = originalMeshName + "h";
      previousMeshNumber = 1;
    }
    if(isNaN(nextMeshNumber) || parseInt(nextMeshNumber) == 0) nextMeshNumber = "";
    var previousMesh = scene.getObjectByName(originalMeshName + previousMeshNumber.toString());
    var nextMesh = scene.getObjectByName(originalMeshName + nextMeshNumber.toString());
    /** Check which layer to make sure mesh has vertexes from that layer */
    var intersectionId = JSON.parse(intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties).id;
    // intersection.faceIndex <= intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].firstLayer*32 ? index = 'renderFirstLayer' : index = 'renderLastLayer';
    parseInt(intersectionId) < parseInt(intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].firstLayer) ? index = 'renderFirstLayer' : index = 'renderLastLayer';
    // while(previousMesh != undefined && JSON.parse(previousMesh.geometry.faces[0].layers)[index] == false && previousMeshNumber != this.nLevels[0]+1)
    while(previousMesh != undefined && JSON.parse(previousMesh.geometry.faces[0].layers)[index] == false)
    {
      previousMeshNumber = previousMeshNumber + 1;
      if(previousMeshNumber == this.nLevels[0]+1)
      {
        previousMesh = scene.getObjectByName(originalMeshName);
      }
      else
      {
        previousMesh = scene.getObjectByName(originalMeshName + previousMeshNumber.toString());
      }
    }
    // while(nextMesh != undefined && JSON.parse(nextMesh.geometry.faces[0].layers)[index] == false && nextMeshNumber != "")
    while(nextMesh != undefined && JSON.parse(nextMesh.geometry.faces[0].layers)[index] == false)
    {
      nextMeshNumber = nextMeshNumber - 1;
      if(nextMeshNumber == 0)
      {
        nextMesh = scene.getObjectByName(originalMeshName);
      }
      else
      {
        nextMesh = scene.getObjectByName(originalMeshName + nextMeshNumber.toString());
      }
    }
    /** Get array of predecessors */
    var startFace = intersection.faceIndex-(intersection.face.a-intersection.face.c)+1;
    /** Color selected vertex */
    for(var j = 0; j < 32; j++)
    {
      // intersection.object.geometry.faces[startFace+j].color.setRGB(1.0, 0.0, 0.0);
      intersection.object.geometry.faces[startFace+j].color.setRGB(intersection.object.geometry.faces[startFace+j].color.r+0.3, intersection.object.geometry.faces[startFace+j].color.g+0.3, intersection.object.geometry.faces[startFace+j].color.b+0.3);
    }
    /** Draw a red circle behind selected vertice to use as border */
    var circleGeometry = new THREE.CircleGeometry(1, 32);
    this.colorVertex(circleGeometry.faces, 0, 32, Array(1.0, 0.0, 0.0));
    this.setTRS(circleGeometry, [intersection.object.geometry.faces[startFace].position.x, intersection.object.geometry.faces[startFace].position.y, intersection.object.geometry.faces[startFace].position.z], undefined, [intersection.object.geometry.faces[startFace].size+1, intersection.object.geometry.faces[startFace].size+1, 1], [3, 1, 2]);
    /** Creating material for nodes */
    var material = new THREE.MeshLambertMaterial( {  wireframe: false, vertexColors:  THREE.FaceColors } );
    /** Create one mesh from single geometry and add it to scene */
    var mesh = new THREE.Mesh(circleGeometry, material);
    mesh.name = "selected";
    /** Alter render order so that node mesh will always be drawn on top of edges */
    mesh.renderOrder = 0;
    intersection.object.parent.add(mesh);
    this.neighbors.push({vertexInfo: parseInt(JSON.parse(intersection.object.geometry.faces[startFace].properties).id)*32, mesh: intersection.object.name});
    // var startFace = parseInt(JSON.parse(intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties).id) * 32;
    var lastSuccessor = -1;
    if(previousMesh != undefined)
    {
      /** Recursively highlight parent nodes */
      this.showNodeParents(this.nEdges, scene, startFace, intersection.object, previousMesh, previousMeshNumber, layout, layer);
    }
    if(nextMesh != undefined)
    {
      /** Recursively highlight child nodes */
      lastSuccessor = this.showNodeChildren(this.nEdges, scene, startFace, intersection.object, nextMesh, nextMeshNumber, layout, layer);
    }
    /** Highlight 'neighbors' */
    if(lastSuccessor == -1)
    {
      this.showNeighbors(scene);
    }
    else if(lastSuccessor != undefined)
    {
      while(nextMesh.name != "MainMesh")
      {
        nextMeshNumber = nextMeshNumber - 1;
        if(nextMeshNumber == 0)
        {
          nextMesh = scene.getObjectByName(originalMeshName);
        }
        else
        {
          nextMesh = scene.getObjectByName(originalMeshName + nextMeshNumber.toString());
        }
      }
      this.renderNeighborEdges(scene, nextMesh, nextMesh.geometry.faces[lastSuccessor]);
      var neighbors = [];
      // this.neighbors.push({vertexInfo: parseInt(successors[i]), mesh: nextMesh.name});
      neighbors[0] = { vertexInfo: parseInt(lastSuccessor), mesh: nextMesh.name };
      for(var i = 0, j = 1; i < nextMesh.geometry.faces[lastSuccessor].neighbors.length; i++, j++)
      {
        // neighbors[j] = { vertexInfo: parseInt(nextMesh.geometry.faces[lastSuccessor].neighbors[i])*32, mesh: nextMesh.name };
        neighbors[j] = { vertexInfo: parseInt(nextMesh.geometry.faces[lastSuccessor].neighbors[i]), mesh: nextMesh.name };
        this.neighbors.push(neighbors[j]);
        this.realNeighbors.push(neighbors[j]);
      }
      this.colorNeighbors(scene, nextMesh.geometry.faces, neighbors);
    }
    this.showNeighborInfo(scene);
  }
}

/**
 * Handles mouse double click. If mouse double clicks vertex, highlight it and its neighbors, as well as its edges.
 * @public
 * @param {Object} evt Event dispatcher.
 * @param {Object} renderer WebGL renderer, containing DOM element's offsets.
 * @param {Object} scene Scene for raycaster.
 * @param {int} layout Graph layout.
 */
EventHandler.prototype.mouseDoubleClickEvent = function(evt, renderer, scene, layout)
{
  /** Check double-click state */
  if(this.doubleClick.getClicked().wasClicked)
  {
    /** Change click variable and update layout */
    this.doubleClick.setClicked({wasClicked: false});
    // this.doubleClick.updateLayout(scene, this, this.neighbors, this.nEdges);
    this.doubleClick.updateLayout(scene, this);
  }
  if(!this.doubleClick.getClicked().wasClicked)
  {
    this.doubleClick.setClicked({wasClicked: true});
    /* Execute ray tracing */
    var intersects = this.configAndExecuteRaytracing(evt, renderer, scene);
    var intersection = intersects[0];
    var layer = 0;
    if(intersection != undefined)
    {
      /** Check which layer vertex is in */
      JSON.parse(intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties).id >= JSON.parse(intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties).lastLayer ? layer = 1 : layer = 0;
      /** Delete vertex info from vueTableHeader and vueTableRows - FIXME not EventHandler responsibility */
      for(var i = 0; i < vueRootInstance.$data.tableCards.length; i++)
      {
        if(vueRootInstance.$data.tableCards[i].headers != "") vueRootInstance.$data.tableCards[i].headers = [];
        if(vueRootInstance.$data.tableCards[i].rows != "") vueRootInstance.$data.tableCards[i].rows = [];
      }
      // if(vueTableHeader._data.headers != "" || vueTableHeaderSecondLayer._data.headers != "")
      // {
      //   vueTableHeader._data.headers = "";
      //   vueTableHeaderSecondLayer._data.headers = "";
      //   $("#divVertexInfoTable").css('visibility', 'hidden');
      //   $("#divVertexInfoTableSecondLayer").css('visibility', 'hidden');
      // }
      // if(vueTableRows._data.rows != "" || vueTableRowsSecondLayer._data.rows != "")
      // {
      //   vueTableRows._data.rows = "";
      //   vueTableRowsSecondLayer._data.rows = "";
      // }
      /** Show both parent and child edges */
      this.showHierarchy(intersection, scene, layout, layer);
      // if(intersection.object.name == "MainMesh")
      // {
      //   this.showNeighbors(scene);
      // }
      // this.showParents(intersection, scene, layout);
      // else
      // {
      //   this.showParents(intersection, scene);
      // }
    }
    // else
    // {
    //   this.showNeighbors(scene);
    //   this.showParents(intersection, scene, layout);
    // }
  }
  // else
  // {
  //   /** Change click variable and update layout */
  //   this.doubleClick.setClicked({wasClicked: false});
  //   // this.doubleClick.updateLayout(scene, this, this.neighbors, this.nEdges);
  //   this.doubleClick.updateLayout(scene, this);
  // }
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
  /** Define tooltip position given x and y */
  this.d3Tooltip.setPosition(x, y);

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
 * Filters information to be shown on tooltip, based on userInfo.
 * @public
 * @param {Array} vertices Array of vertices.
 * @returns {Array} Array of filtered information to be shown.
 */
EventHandler.prototype.getTooltipInfo = function(vertices)
{
  var filteredVerts = [];
  if(this.userInfo !== undefined)
  {
    for(var i = 0; i < this.userInfo.length; i++)
    {
      this.userInfo[i] = this.userInfo[i].trim();
    }
    for(var i = 0; i < vertices.length; i++)
    {
      var obj = JSON.parse(JSON.stringify(vertices[i]));
      for(key in vertices[i])
      {
        if(this.userInfo.indexOf(key) == -1)
        {
          obj[key] = undefined;
        }
      }
      filteredVerts.push(obj);
    }
  }
  return filteredVerts;
}

/**
 * Handles mouse click. If mouse clicks vertex, show its current id and weight, as well as vertexes associated with it.
 * @public
 * @param {Object} evt Event dispatcher.
 * @param {Object} renderer WebGL renderer, containing DOM element's offsets.
 * @param {Object} scene Scene for raycaster.
 * @param {int} layout Graph layout.
 */
EventHandler.prototype.mouseClickEvent = function(evt, renderer, scene, layout)
{
  var intersects = this.configAndExecuteRaytracing(evt, renderer, scene);
  var intersection = intersects[0];
  if(intersection != undefined)
  {
    if(intersection.face) /** Intersection with vertice */
    {
      /** Execute double-click */
      this.mouseDoubleClickEvent(evt, renderer, scene, layout);
      var vertices = JSON.parse(intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties);
      /** First layer */
      // if(intersection.faceIndex <= intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].firstLayer*32)
      // {
      //   this.showVertexInfo(vertices, vueTableRows, "#divVertexInfoTable");
      // }
      /** Last layer */
      // else
      // {
      //   this.showVertexInfo(vertices, vueTableRowsSecondLayer, "#divVertexInfoTableSecondLayer");
      // }
      /** Show stats in bar charts (if any is available) */
      this.statsHandler.generateAndVisualizeStats(JSON.parse(intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties));
      /** Show word cloud (if any is available) */
      this.statsHandler.generateAndVisualizeWordCloud(JSON.parse(intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties));
      /** Updated data; update variable */
      this.updateData.wasUpdated = true;
      /** Populate and show tooltip information */
      this.d3Tooltip.populateAndShowTooltip(this.getTooltipInfo(vertices));
    }
    else
    {
      /** No data updated; update variable */
      this.updateData.wasUpdated = false;
    }
  }
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
    var intersects = this.configAndExecuteRaytracing(evt, renderer, scene);
    var intersection = intersects[0];
    /* Unhighlight any already highlighted element - FIXME this is problematic; highlightedElements might have index of an element that is being highlighted because of a double click. Must find a way to check from which specific mesh that index is */
    for(var i = 0; i < this.highlightedElements.length; i++)
    {
      for(var j = 0; j < parseInt(this.nLevels)+1; j++)
      {
        var element;
        j == 0 ? element = scene.getObjectByName("MainMesh", true) : element = scene.getObjectByName("MainMesh" + j.toString(), true);
        // var element = scene.getObjectByName("MainMesh", true);
        // var el = (this.highlightedElements[i]/32) + 8;
        var el = this.highlightedElements[i];
        var fd = this.neighbors.find(function(elmt){
          return (element !== undefined && elmt.vertexInfo == el && elmt.mesh == element.name);
          // return (i >= length) ? undefined : elmt.vertexInfo == (this.highlightedElements[i]);
        });
        if(element !== undefined && fd === undefined)
        {
          if((element.name == this.highlightedElements[i].meshName))
          {
            this.highlightedElements[i] = this.highlightedElements[i].idx;
            var endPoint = this.highlightedElements[i] + 32;
            for(var k = this.highlightedElements[i]; k < endPoint; k++)
            {
              if(element.geometry.faces[k] !== undefined) element.geometry.faces[k].color.setRGB(element.geometry.faces[k].color.r-0.3, element.geometry.faces[k].color.g-0.3, element.geometry.faces[k].color.b-0.3);
            }
            element.geometry.colorsNeedUpdate = true;
          }
        }
      }
      if(element !== undefined && fd === undefined) this.highlightedElements.splice(i, 1);
    }
    /** Hiding vertex information */
    /* Highlight element (if intersected) */
    if(intersection != undefined)
    {
      // console.log(intersection);
      if(intersection.face) /** Intersection with vertice */
      {
        // intersection.face.color.setRGB(0.0, 1.0, 0.0);
        /** First check if vertex isn't already highlighted because of double-clicking */
        var found = this.neighbors.find(function(elmt){
          return ((elmt.vertexInfo == ((intersection.faceIndex-(intersection.face.a-intersection.face.c)+1)) || elmt.vertexInfo == ((intersection.faceIndex-(intersection.face.a-intersection.face.c)+1)/32)) && elmt.mesh == intersection.object.name);
        });
        if(found == undefined)
        {
          /** face.c position is starting vertex; find the difference between face.a and face.c, and color next 32 vertices to color entire cirle */
          var endPoint = intersection.faceIndex-(intersection.face.a-intersection.face.c)+1 + 32;
          for(var i = intersection.faceIndex-(intersection.face.a-intersection.face.c)+1; i < endPoint; i++)
          {
            intersection.object.geometry.faces[i].color.setRGB(intersection.object.geometry.faces[i].color.r+0.3, intersection.object.geometry.faces[i].color.g+0.3, intersection.object.geometry.faces[i].color.b+0.3);
          }
          intersection.object.geometry.colorsNeedUpdate = true;
          this.highlightedElements.push({meshName: intersection.object.name, idx: intersection.faceIndex-(intersection.face.a-intersection.face.c)+1});
        }
        // if(found == undefined)
        // {
        // }
      }
      else /** Intersection with edge */
      {
        /** Do nothing - TODO for now */
        /** Remove tooltip from highlighting */
        this.d3Tooltip.hideTooltip();
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
    this.gradientLegendId = "gradientScaleId";
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
    d3.select("#" + this.gradientLegendId).remove();
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
      .style("padding-right", "20px")
      .style("margin", "25px");
    span._groups[0][0].innerHTML = gradientTitle;
    /** Create SVG element */
    var key = d3.select("#" + elementId)
      .append("svg")
      .attr("id", this.gradientLegendId)
      .attr("width", this.width)
      .attr("height", this.height)
      .style("margin", "25px");
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

	/**
	* @author diego2337 - https://github.com/diego2337
	* Adding specific changes to orbitControls.js file to work with threeGraph.
	*/

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

/**
 * Base class for legends, to identify community colors. Uses d3.legend component from https://d3-legend.susielu.com/
 * @author Diego S. Cintra
 * Date: 01 november 2018
 */

/**
 * @constructor
 * @param {Array} domain Domain of names to be used in legend.
 * @param {Array} range Range of values for each name.
 * @param {int} width Width of gradient legend, in pixel units.
 * @param {int} height Height of gradient legend, in pixel units.
 */
var ScaleLegend = function(domain, range, width, height)
{
  try
  {
    this.legendElementId = "legendElementId";
    this.width = ecmaStandard(width, 350);
    this.height = ecmaStandard(height, 50);
    this.domain = domain;
    this.range = range;
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in ScaleLegend constructor. " + err;
  }
}

/**
 * @desc Destructor equivalent function to clear page of svg elements, so that they can be deleted with 'delete' keyword.
 * @public
 */
ScaleLegend.prototype.clear = function()
{
  try
  {
    // d3.select("#" + this.legendElementId).remove();
    d3.select("#scaleLegendSVGID").remove();
    d3.select("#" + this.legendElementId).remove();
  }
  catch(err)
  {
    throw "Unexpected error ocurred at line " + err.lineNumber + ", in ScaleLegend.clear. " + err;
  }
}

/**
 * @desc Convert array values to RGB.
 * @param {Array} values Values to be converted to RGB notation.
 * @returns {Array} Array of arrays containing following format: ['rgb(0, 0, 0)', 'rgb(255, 255, 255)'...].
 */
ScaleLegend.prototype.toRGB = function(values)
{
  var arr = [];
  values.forEach(function(d, i){
    var rgb = "rgb(";
    d.forEach(function(e, j){
      j != 2 ? rgb = rgb + (e*255).toString() + ',' : rgb = rgb + (e*255).toString();
    });
    rgb = rgb + ')';
    arr.push(rgb);
  });
  return arr;
}

/**
 * @desc Creates a scale legend on HTML page, defining elements contained in it. Appends to HTML page.
 * @param {string} elementId Id of element in which legend will be appended.
 * @param {string} legendTitle Title for Legend.
 */
ScaleLegend.prototype.createScaleLegend = function(elementId, legendTitle)
{
  try
  {
    /** Set scale title */
    var span = d3.select("#" + elementId)
      .append("span")
      .attr("id", this.legendElementId)
      .style("padding-right", "20px")
      .style("margin", "25px");
    span._groups[0][0].innerHTML = legendTitle;
    /** Create SVG element */
    var svg = d3.select("#" + elementId)
      .append("svg")
      .attr("id", "scaleLegendSVGID")
      .attr("width", this.width)
      .attr("height", this.height)
      .style("margin", "25px");

    /** Set domain adjusted to range */
    var ordinal = d3.scaleOrdinal()
      .domain(this.domain)
      .range(this.toRGB(this.range));

    svg.append("g")
      .attr("class", "legendOrdinal")
      .attr("transform", "translate(30,20)");

    var paddingValue = 0;
    this.domain.forEach(function(d, i){
      if(d.length > paddingValue)
      {
        paddingValue = d.length;
      }
    });

    var legendOrdinal = d3.legendColor()
      .shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
      .shapePadding(paddingValue*4.5)
      .orient("horizontal")
      .scale(ordinal);

    svg.select(".legendOrdinal")
      .call(legendOrdinal);

  }
  catch(err)
  {
     throw "Unexpected error ocurred at line " + err.lineNumber + ", in ScaleLegend.createScaleLegend. " + err;
  }
}

/**
 * Base class for statsHandler, implementing basic statistical processing and visualization.
 * @author Diego Cintra
 * Date: 31 July 2018
 */

/**
 * @constructor
 * @param {String} SVGId Id to store <svg> id value.
 * @param {String} d3WordCloudId HTML element to build d3WordCloud in.
 */
var statsHandler = function(SVGId, d3WordCloudId)
{
  this.d3BarChart = new d3BarChart(SVGId);
  this.d3WordCloudWrapper = new d3WordCloudWrapper();
  this.d3WordCloud = new d3WordCloud(d3WordCloudId, 300, 600, 1);
}

/**
 * @desc Generate vertex stats. Sends information server-side to generate statistics.
 * @param {JSON} vertexProps Vertex properties, to generate statistics.
 */
statsHandler.prototype.generateStats = function(vertexProps)
{
  $.ajax({
    url: '/graph/generateStats',
    type: 'POST',
    /** FIXME - <bold>NEVER use async!</bold> */
    async: false,
    data: { props: vertexProps },
    xhr: loadGraph
  });
}

/**
 * @desc Visualize vertex stats as bar charts. Invokes "barChart" class to render chart.
 * @param {int} id Vertex id.
 */
statsHandler.prototype.visualizeStats = function(id)
{
  this.d3BarChart.created3BarChart();
  var statsHandlerScope = this;
  $.ajax({
    url: '/graph/getStats',
    type: 'POST',
    data: { vertexId: id },
    success: function(html){
      if(html != undefined && html != "" && (html.length !== undefined && html.length > 0))
      {
          html = JSON.parse(html).arr;
          statsHandlerScope.d3BarChart.populateAndShowBarChart(html);
          $("#vertexStatsCard").css('visibility', 'visible');
      }
    },
    xhr: loadGraph
  });
}

 /**
  * @desc Generate and visualize vertex stats.
  * @param {JSON} vertexProps Vertex properties, to generate statistics.
  */
statsHandler.prototype.generateAndVisualizeStats = function(vertexProps)
{
  if(this.d3BarChart != undefined)
  {
    this.d3BarChart.clearBarChart();
  }
  /** Generate statistics */
  this.generateStats(vertexProps);
  /** Visualize statistics */
  this.visualizeStats(vertexProps.id);
}

/**
 * @desc Generate and visualize word cloud, if any is available.
 * @param {JSON} vertexProps Vertex properties, to generate statistics.
 */
statsHandler.prototype.generateAndVisualizeWordCloud = function(vertexProps)
{
  if(this.d3WordCloud != undefined)
  {
    this.d3WordCloud.clearWordCloud();
  }
  /** Fetch array of words and frequencies */
  this.d3WordCloudWrapper.fetchWords(vertexProps, this.d3WordCloud);
  $("#wordCloudCard").css('visibility', 'visible');
  // this.d3WordCloud.created3WordCloud(this.d3WordCloudWrapper.fetchWords(vertexProps));
}
