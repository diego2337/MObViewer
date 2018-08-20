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
 */
var EventHandler = function(raycaster, HTMLelement, SVGId, numOfLevels)
{
    this.raycaster = ecmaStandard(raycaster, new THREE.Raycaster());
    this.raycaster.linePrecision = 0.1;
    this.highlightedElements = [];
    this.neighbors = [];
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
    this.statsHandler = new statsHandler(SVGId);
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
    url: '/getEdgesWeights',
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
    faces[i].color.setRGB(color[0], color[1], color[2]);
  }
}

/**
 * Change neighbor vertexes colors.
 * @param {Array} faces Array of faces objects.
 * @param {Array} neighbors Neighbors to be colored.
 */
EventHandler.prototype.colorNeighbors = function(faces, neighbors)
{
  /** First element of 'neighbors' array is double-clicked vertex */
  for(var i = 1; i < neighbors.length; i++)
  {
    var endPoint = ((faces[neighbors[0].vertexInfo].neighbors[i]) * 32) + 32;
    // var endPoint = ((faces[neighbors[0].vertexInfo].neighbors[i])) + 32;
    // var endPoint = ((faces[neighbors[0].vertexInfo*32].neighbors[i])) + 32;
    this.colorVertex(faces, faces[neighbors[0].vertexInfo].neighbors[i]*32, endPoint, new Array(1.0, 0.0, 0.0));
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
    this.neighbors.push({vertexInfo: this.highlightedElements[i], mesh: element.name, edgeColor: {r:0, g:0, b:0}});
    for(var j = 1; j < element.geometry.faces[this.highlightedElements[i]].neighbors.length; j++)
    {
      this.neighbors.push({vertexInfo: element.geometry.faces[this.highlightedElements[i]].neighbors[j], mesh: element.name, edgeColor: {r:0, g:0, b:0}});
    }
    this.renderNeighborEdges(scene, element, element.geometry.faces[this.highlightedElements[i]]);
    this.colorNeighbors(element.geometry.faces, this.neighbors);
    // for(var j = 1; j < element.geometry.faces[this.highlightedElements[i]].neighbors.length; j++)
    // {
    //   var endPoint = ((element.geometry.faces[this.highlightedElements[i]].neighbors[j]) * 32) + 32;
    //   for(var k = (element.geometry.faces[this.highlightedElements[i]].neighbors[j]) * 32; k < endPoint; k++)
    //   {
    //       element.geometry.faces[k].color.setRGB(1.0, 0.0, 0.0);
    //   }
    // }
    element.geometry.colorsNeedUpdate = true;
    /** Remove itself so it won't unhighlight as soon as mouse moves out */
    this.highlightedElements.splice(i, 1);
  }
  // if(!this.clicked.wasClicked)
  // {
  //
  // }
  // else if(this.clicked.wasClicked)
  // {
  //   scene.remove(scene.getObjectByName("neighborEdges"));
  //   for(var i = 0; i < this.neighbors.length; i++)
  //   {
  //     var mesh = scene.getObjectByName(this.neighbors[i].mesh);
  //     for(var j = 0; j < 32; j++)
  //     {
  //       if(mesh.geometry.faces[(this.neighbors[i].vertexInfo*32)+j] !== undefined)
  //       {
  //         mesh.geometry.faces[(this.neighbors[i].vertexInfo*32)+j].color.setRGB(0.0, 0.0, 0.0);
  //       }
  //       else if(mesh.geometry.faces[(this.neighbors[i].vertexInfo)+j] !== undefined)
  //       {
  //         mesh.geometry.faces[(this.neighbors[i].vertexInfo)+j].color.setRGB(0.0, 0.0, 0.0);
  //       }
  //       mesh.geometry.colorsNeedUpdate = true;
  //     }
  //   }
  //   element.geometry.colorsNeedUpdate = true;
  //   /** Clearing array of neighbors */
  //   this.neighbors = [];
  // }
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
  // console.log("currentMesh:");
  // console.log(currentMesh);
  // console.log("previousMesh");
  // console.log(previousMesh);
  // console.log("startFace:");
  // console.log(startFace);
  /** Recursion termination condition */
  if(previousMesh != undefined)
  {
    var properties = JSON.parse(currentMesh.geometry.faces[startFace].properties);
    var edgeGeometry = new THREE.Geometry();
    var sourcePos = currentMesh.geometry.faces[startFace].position;
    var v1 = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
    /** Color vertexes */
    for(var j = 0; j < 32; j++)
    {
      currentMesh.geometry.faces[startFace+j].color.setRGB(1.0, 0.0, 0.0);
    }
    currentMesh.geometry.colorsNeedUpdate = true;
    this.neighbors.push({vertexInfo: parseInt(JSON.parse(currentMesh.geometry.faces[startFace].properties).id)*32, mesh: currentMesh.name});
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
      url: '/getSorted',
      type: 'POST',
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
            previousMesh.geometry.faces[(parseInt(data.array[i])) + j].color.setRGB(1.0, 0.0, 0.0);
          }
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
          edgeGeometry.colors[i] = new THREE.Color("rgb(255, 0, 0)");
          edgeGeometry.colors[i+1] = edgeGeometry.colors[i];
        }
        edgeGeometry.colorsNeedUpdate = true;

        /** Create one LineSegments and add it to scene */
        var edgeMaterial = new THREE.LineBasicMaterial({vertexColors:  THREE.VertexColors});
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
  /** Recursion termination condition */
  if(nextMesh != undefined)
  {
    var properties = JSON.parse(currentMesh.geometry.faces[startFace].properties);
    var edgeGeometry = new THREE.Geometry();
    var sourcePos = currentMesh.geometry.faces[startFace].position;
    var v1 = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
    // /** Color vertexes */
    for(var j = 0; j < 32; j++)
    {
      currentMesh.geometry.faces[startFace+j].color.setRGB(1.0, 0.0, 0.0);
    }
    currentMesh.geometry.colorsNeedUpdate = true;
    this.neighbors.push({vertexInfo: parseInt(JSON.parse(currentMesh.geometry.faces[startFace].properties).id)*32, mesh: currentMesh.name});
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
      url: '/getSortedSuccessors',
      type: 'POST',
      data: { currentMesh: currentMesh.name, nextMesh: nextMesh.name, levels: l, idx: JSON.parse(currentMesh.geometry.faces[startFace].properties).id },
      success: function(data){
        data = JSON.parse(data);
        console.log("data:");
        console.log(data);
        for(var i = 0; nextMesh.geometry.faces[(parseInt(data.array[i]))] != undefined && i < data.array.length; i++)
        {
          data.array[i] = parseInt(data.array[i])*32;
          // if(JSON.parse(nextMesh.geometry.faces[(parseInt(data.array[i]))].layers).renderFirstLayer == false)
          if(nextMesh.geometry.faces[(parseInt(data.array[i]))] == undefined)
          {
            data.array[i] = data.array[i] - (parseInt(nextMesh.geometry.faces[0].firstLayer)*32);
            console.log("data after if:");
            console.log(data);
          }
          /** Color successors */
          var targetPos = nextMesh.geometry.faces[(parseInt(data.array[i]))].position;
          layScope.neighbors.push({vertexInfo: parseInt(data.array[i]), mesh: nextMesh.name});
          var v2 = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
          for(var j = 0; j < 32; j++)
          {
            nextMesh.geometry.faces[(parseInt(data.array[i])) + j].color.setRGB(1.0, 0.0, 0.0);
          }
          /** Add edges to 'parentConnections' geometry */
          edgeGeometry.vertices.push(v1);
          edgeGeometry.vertices.push(v2);
        }
        nextMesh.geometry.colorsNeedUpdate = true;
        for(var i = 0; i < edgeGeometry.vertices.length; i = i + 2)
        {
          edgeGeometry.colors[i] = new THREE.Color("rgb(255, 0, 0)");
          edgeGeometry.colors[i+1] = edgeGeometry.colors[i];
        }
        edgeGeometry.colorsNeedUpdate = true;

        /** Create one LineSegments and add it to scene */
        var edgeMaterial = new THREE.LineBasicMaterial({vertexColors:  THREE.VertexColors});
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
        for(var i = 0; data.array.length; i++)
        {
          return layScope.showNodeChildren(this.nEdges, scene, parseInt(data.array[i]), nextMesh, nextMeshNumber == -1 ? undefined : nextMeshNumber == 0 ? scene.getObjectByName("MainMesh") : scene.getObjectByName("MainMesh" + nextMeshNumber), nextMeshNumber, layout, layer);
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
    console.log("entered else if");
    nextMeshNumber = parseInt(nextMeshNumber);
    nextMeshNumber = nextMeshNumber - 1;
    this.showNodeChildren(this.nEdges, scene, startFace, currentMesh, nextMeshNumber == -1 ? undefined : nextMeshNumber == 0 ? scene.getObjectByName("MainMesh") : scene.getObjectByName("MainMesh" + nextMeshNumber), nextMeshNumber, layout, layer);
  }
  else
  {
    return startFace;
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
    while(JSON.parse(previousMesh.geometry.faces[0].layers)[index] == false)
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
    while(JSON.parse(nextMesh.geometry.faces[0].layers)[index] == false)
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
    if(lastSuccessor != -1)
    {
      this.showNeighbors(scene);
    }
    // else if(lastSuccessor != undefined)
    // {
    //   this.renderNeighborEdges(scene, nextMesh, nextMesh.geometry.faces[lastSuccessor]);
    //   var neighbors = [];
    //   // this.neighbors.push({vertexInfo: parseInt(successors[i]), mesh: nextMesh.name});
    //   neighbors[0] = { vertexInfo: parseInt(lastSuccessor), mesh: nextMesh.name };
    //   for(var i = 0, j = 1; i < nextMesh.geometry.faces[lastSuccessor].neighbors.length; i++, j++)
    //   {
    //     neighbors[j] = { vertexInfo: parseInt(nextMesh.geometry.faces[lastSuccessor].neighbors[i])*32, mesh: nextMesh.name };
    //     this.neighbors.push(neighbors[j]);
    //   }
    //   this.colorNeighbors(nextMesh.geometry.faces, neighbors);
    // }
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
      if(vueTableHeader._data.headers != "" || vueTableHeaderSecondLayer._data.headers != "")
      {
        vueTableHeader._data.headers = "";
        vueTableHeaderSecondLayer._data.headers = "";
        $("#divVertexInfoTable").css('visibility', 'hidden');
        $("#divVertexInfoTableSecondLayer").css('visibility', 'hidden');
      }
      if(vueTableRows._data.rows != "" || vueTableRowsSecondLayer._data.rows != "")
      {
        vueTableRows._data.rows = "";
        vueTableRowsSecondLayer._data.rows = "";
      }
      /** Show both parent and child edges */
      this.showHierarchy(intersection, scene, layout, layer);
      if(intersection.object.name == "MainMesh")
      {
        this.showNeighbors(scene);
      }
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
  else
  {
    /** Change click variable and update layout */
    this.doubleClick.setClicked({wasClicked: false});
    // this.doubleClick.updateLayout(scene, this, this.neighbors, this.nEdges);
    this.doubleClick.updateLayout(scene, this);
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
 */
EventHandler.prototype.mouseClickEvent = function(evt, renderer, scene)
{
  var intersects = this.configAndExecuteRaytracing(evt, renderer, scene);
  var intersection = intersects[0];
  if(intersection != undefined)
  {
    if(intersection.face) /** Intersection with vertice */
    {
      /** First layer */
      if(intersection.faceIndex <= intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].firstLayer*32)
      {
        var vertices = JSON.parse(intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties);
        var vertexVueHeaders = [], vertexVueRows = [], valuesOfVertex;
        /** Load already existing elements clicked in array of rows */
        for(var j = 0; j < vueTableRows._data.rows.length; j++)
        {
          vertexVueRows.push(vueTableRows._data.rows[j]);
        }
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
        // if(intersection.object.geometry.faces[intersection.faceIndex
        // for(var j = 0; vertices.vertexes !== undefined && j < vertices.vertexes.length; j++)
        for(var j = 0; j < vertices.length/** vertices.vertexes.length */; j++)
        {
          var tempArr = [];
          for(key in vertices[j])
          {
            tempArr.push(key);
          }
          // if(j == 0)
          if(vertexVueHeaders.length < tempArr.length)
          {
            // for(key in vertices.vertexes[j])
            // for(key in vertices[j])
            // {
            //   vertexVueHeaders.push(key);
            // }
            vertexVueHeaders = tempArr;
            // console.log("vertexVueHeaders:");
            // console.log(vertexVueHeaders);
            /** Sort headers */
            vertexVueHeaders.sort(function(a, b){
              return ('' + a).localeCompare(b);
            });
            /** Construct a new vue table header */
            vueTableHeader._data.headers = vertexVueHeaders;
          }
        }
        for(var j = 0; j < vertices.length/** vertices.vertexes.length */; j++)
        {
          // if(j == 0)
          // {
          //   // for(key in vertices.vertexes[j])
          //   for(key in vertices[j])
          //   {
          //     vertexVueHeaders.push(key);
          //   }
          //   // console.log("vertexVueHeaders:");
          //   // console.log(vertexVueHeaders);
          //   /** Sort headers */
          //   vertexVueHeaders.sort(function(a, b){
          //     return ('' + a).localeCompare(b);
          //   });
          //   /** Construct a new vue table header */
          //   vueTableHeader._data.headers = vertexVueHeaders;
          // }
          /** Sort vertices[j] */
          var ordered = {};
          Object.keys(vertices[j]).sort().forEach(function(key) {
            ordered[key] = vertices[j][key];
          });
          // vertexVueRows.push(vertices.vertexes[j]);
          for(key in vertexVueHeaders)
          {
            if(!(vertexVueHeaders[key] in ordered))
            {
              ordered[key] = "No value";
            }
          }
          vertexVueRows.push(ordered);
        }
        /** Construct a new vue table data */
        vueTableRows._data.rows = vertexVueRows;
        /** Show tables containing vertex info */
        $("#divVertexInfoTable").css('visibility', 'visible');
      }
      else /** Last layer */
      {
        var vertices = JSON.parse(intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties);
        var vertexVueHeaders = [], vertexVueRows = [], valuesOfVertex;
        /** Load already existing elements clicked in array of rows */
        for(var j = 0; j < vueTableRowsSecondLayer._data.rows.length; j++)
        {
          vertexVueRows.push(vueTableRowsSecondLayer._data.rows[j]);
        }
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
        for(var j = 0; j < vertices.length; j++)
        {
          var tempArr = [];
          for(key in vertices[j])
          {
            tempArr.push(key);
          }
          if(vertexVueHeaders.length < tempArr.length)
          {
            vertexVueHeaders = tempArr
            /** Sort headers */
            vertexVueHeaders.sort(function(a, b){
              return ('' + a).localeCompare(b);
            });
            /** Construct a new vue table header */
            vueTableHeaderSecondLayer._data.headers = vertexVueHeaders;
          }
        }
        for(var j = 0; j < vertices.length/** vertices.vertexes.length */; j++)
        {
          /** Sort vertices[j] */
          var ordered = {};
          Object.keys(vertices[j]).sort().forEach(function(key) {
            ordered[key] = vertices[j][key];
          });
          // vertexVueRows.push(vertices.vertexes[j]);
          for(key in vertexVueHeaders)
          {
            if(!(vertexVueHeaders[key] in ordered))
            {
              ordered[key] = "No value";
            }
          }
          vertexVueRows.push(ordered);
        }
        /** Construct a new vue table data */
        vueTableRowsSecondLayer._data.rows = vertexVueRows;
        /** Show tables containing vertex info */
        $("#divVertexInfoTableSecondLayer").css('visibility', 'visible');
      }
      /** Show stats in bar charts (if any is available) */
      this.statsHandler.generateAndVisualizeStats(JSON.parse(intersection.object.geometry.faces[intersection.faceIndex-(intersection.face.a-intersection.face.c)+1].properties));
      /** Updated data; update variable */
      this.updateData.wasUpdated = true;
      /** Populate and show tooltip information */
      this.d3Tooltip.populateAndShowTooltip(this.getTooltipInfo(vertices));
      // this.d3Tooltip.populateAndShowTooltip("<span>Ok!</span>");
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
    // var intersects = this.raycaster.intersectObjects(scene.children, true);
    var intersects = this.configAndExecuteRaytracing(evt, renderer, scene);
    var intersection = intersects[0];
    /* Unhighlight any already highlighted element - FIXME this is problematic; highlightedElements might have index of an element that is being highlighted because of a double click. Must find a way to check from which specific mesh that index is */
    for(var i = 0; i < this.highlightedElements.length; i++)
    {
      for(var j = 0; j < parseInt(this.nLevels)+1; j++)
      {
        var endPoint = this.highlightedElements[i] + 32;
        var element;
        j == 0 ? element = scene.getObjectByName("MainMesh", true) : element = scene.getObjectByName("MainMesh" + j.toString(), true);
        // var element = scene.getObjectByName("MainMesh", true);
        var el = (this.highlightedElements[i]/32) + 8;
        var fd = this.neighbors.find(function(elmt){
          return (elmt.vertexInfo == el && elmt.mesh == element.name);
          // return (i >= length) ? undefined : elmt.vertexInfo == (this.highlightedElements[i]);
        });
        for(var k = this.highlightedElements[i]; k < endPoint && fd === undefined; k++)
        {
          if(element.geometry.faces[k] !== undefined) element.geometry.faces[k].color.setRGB(0.0, 0.0, 0.0);
        }
        element.geometry.colorsNeedUpdate = true;
      }
      if(fd === undefined) this.highlightedElements.splice(i, 1);
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
          // console.log("elmt.vertexInfo:");
          // console.log(elmt.vertexInfo);
          // console.log("((intersection.faceIndex-(intersection.face.a-intersection.face.c)+1)):");
          // console.log(((intersection.faceIndex-(intersection.face.a-intersection.face.c)+1)));
          return ((elmt.vertexInfo == ((intersection.faceIndex-(intersection.face.a-intersection.face.c)+1)) || elmt.vertexInfo == ((intersection.faceIndex-(intersection.face.a-intersection.face.c)+1)/32)) && elmt.mesh == intersection.object.name);
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
        /** Do nothing - TODO for now */
        /** Remove tooltip from highlighting */
        this.d3Tooltip.hideTooltip();
      }
    }
}
