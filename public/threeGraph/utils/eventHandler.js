/**
 * Base class for a Event handler, implementing Event interface.
 * @author Diego S. Cintra
 */

/**
 * @constructor
 * @param {Object} raycaster Defined raycaster, defaults to creating a new one.
 * @param {String} HTMLelement HTML element to build d3Tooltip div in.
 * @param {int} numOfLevels Number of coarsened graphs.
 */
var EventHandler = function(raycaster, HTMLelement, numOfLevels)
{
    this.raycaster = ecmaStandard(raycaster, new THREE.Raycaster());
    this.raycaster.linePrecision = 0.1;
    this.highlightedElements = [];
    this.neighbors = [];
    this.clicked = {wasClicked: false};
    this.updateData = {wasUpdated: false};
    this.d3Tooltip = new d3Tooltip(HTMLelement);
    this.d3Tooltip.created3Tooltip();
    this.nLevels = numOfLevels;
    this.userInfo = undefined;
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
  for(var i = 1; i < neighbors.neighbors.length; i++)
  {
    /** Fetch positions from mesh */
    var targetPos = mesh.geometry.faces[neighbors.neighbors[i]*32].position;
    var v1 = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
    var v2 = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
    edgeGeometry.vertices.push(v1);
    edgeGeometry.vertices.push(v2);
  }
  for(var i = 0; i < edgeGeometry.vertices.length; i = i + 2)
  {
    edgeGeometry.colors[i] = new THREE.Color('rgb(0, 0, 255)');
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
}

/**
 * Show coarsened graph neighbors when double clicked.
 * @param {Object} scene Scene for raycaster.
 */
EventHandler.prototype.showNeighbors = function(scene)
{
  var element = scene.getObjectByName("MainMesh", true);
  if(!this.clicked.wasClicked)
  {
    // // var lineSegments = scene.getObjectById(8, true);
    // // var lineSegments = scene.children[1];
    // var lineSegments = scene.getObjectByProperty("type", "LineSegments");
    /** Find highlighted vertex and highlight its neighbors */
    for(var i = 0; i < this.highlightedElements.length; i++)
    {
      this.clicked.wasClicked = true;
      /** Add itself for highlighting */
      this.neighbors.push({vertexInfo: this.highlightedElements[i]/32, mesh: element.name, edgeColor: {r:0, g:0, b:0}});
      for(var j = 1; j < element.geometry.faces[this.highlightedElements[i]].neighbors.length; j++)
      {
        this.neighbors.push({vertexInfo: element.geometry.faces[this.highlightedElements[i]].neighbors[j], mesh: element.name, edgeColor: {r:0, g:0, b:0}});
      }
      this.renderNeighborEdges(scene, element, element.geometry.faces[this.highlightedElements[i]]);
      for(var j = 1; j < element.geometry.faces[this.highlightedElements[i]].neighbors.length; j++)
      {
        var endPoint = ((element.geometry.faces[this.highlightedElements[i]].neighbors[j]) * 32) + 32;
        for(var k = (element.geometry.faces[this.highlightedElements[i]].neighbors[j]) * 32; k < endPoint; k++)
        {
            element.geometry.faces[k].color.setRGB(1.0, 0.0, 0.0);
        }
      }
      element.geometry.colorsNeedUpdate = true;
      /** Remove itself so it won't unhighlight as soon as mouse moves out */
      this.highlightedElements.splice(i, 1);
    //   var startEdge = element.geometry.faces[this.highlightedElements[i]].position;
    //   // var startPosition = element.geometry.faces[this.highlightedElements[i]].positionIndex;
    //   for(var j = 1; j < element.geometry.faces[this.highlightedElements[i]].neighbors.length; j++)
    //   {
    //     var endPoint = ((element.geometry.faces[this.highlightedElements[i]].neighbors[j]) * 32) + 32;
    //     for(var k = (element.geometry.faces[this.highlightedElements[i]].neighbors[j]) * 32; k < endPoint; k++)
    //     {
    //         element.geometry.faces[k].color.setRGB(1.0, 0.0, 0.0);
    //     }
    //     this.clicked.wasClicked = true;
    //     /** Highlight connected edges */
    //     var neighborIndex = element.geometry.faces[this.highlightedElements[i]].neighbors[j] * 32;
    //     var endEdge = element.geometry.faces[neighborIndex].position;
    //     var index = this.findEdgePairIndex(lineSegments.geometry.vertices, startEdge, endEdge);
    //     /** Find index of end position */
    //     // var endPosition = element.geometry.faces[neighborIndex].positionIndex;
    //     var originalColor = {r:0, g:0, b:0};
    //     if(index != -1)
    //     {
    //       // originalColor = lineSegments.geometry.colors[index];
    //       originalColor.r = lineSegments.geometry.colors[index].r;
    //       originalColor.g = lineSegments.geometry.colors[index].g;
    //       originalColor.b = lineSegments.geometry.colors[index].b;
    //       lineSegments.geometry.colors[index].setRGB(1.0, 0.0, 0.0);
    //     }
    //     this.neighbors.push({vertexInfo: element.geometry.faces[this.highlightedElements[i]].neighbors[j], edgeColor: originalColor});
    //   }
    //   // lineSegments.geometry.colors[startPosition].setRGB(1.0, 0.0, 0.0);
    //   // lineSegments.geometry.colors[0].setRGB(1.0, 0.0, 0.0);
    //   /** Remove itself so it won't unhighlight as soon as mouse moves out */
    //   this.highlightedElements.splice(i, 1);
    }
    // element.geometry.colorsNeedUpdate = true;
    // lineSegments.geometry.colorsNeedUpdate = true;
  }
  else if(this.clicked.wasClicked)
  {
    this.clicked.wasClicked = false;
    scene.remove(scene.getObjectByName("neighborEdges"));
    for(var i = 0; i < this.neighbors.length; i++)
    {
      var mesh = scene.getObjectByName(this.neighbors[i].mesh);
      for(var j = 0; j < 32; j++)
      {
        mesh.geometry.faces[(this.neighbors[i].vertexInfo*32)+j].color.setRGB(0.0, 0.0, 0.0);
        mesh.geometry.colorsNeedUpdate = true;
      }
      // var endPoint = (this.neighbors[i].vertexInfo * 32) + 32;
      // for(var j = this.neighbors[i].vertexInfo*32; j < endPoint; j++)
      // {
      //   element.geometry.faces[j].color.setRGB(0.0, 0.0, 0.0);
      // }
    }
    element.geometry.colorsNeedUpdate = true;
    /** An element was already clicked and its neighbors highlighted; unhighlight all */
    // var element = scene.getObjectByName("MainMesh", true);
    // // var lineSegments = scene.getObjectById(8, true);
    // // var lineSegments = scene.children[1];
    // var lineSegments = scene.getObjectByProperty("type", "LineSegments");
    // var startEdge = element.geometry.faces[this.neighbors[0].vertexInfo*32].position;
    // for(var i = 0; i < this.neighbors.length; i++)
    // {
    //   var endPoint = (this.neighbors[i].vertexInfo * 32) + 32;
    //   for(var j = this.neighbors[i].vertexInfo*32; j < endPoint; j++)
    //   {
    //     element.geometry.faces[j].color.setRGB(0.0, 0.0, 0.0);
    //   }
    //   element.geometry.colorsNeedUpdate = true;
    //   if(i != 0)
    //   {
    //     var endEdge = element.geometry.faces[this.neighbors[i].vertexInfo*32].position;
    //     var index = this.findEdgePairIndex(lineSegments.geometry.vertices, startEdge, endEdge);
    //     if(index != -1)
    //     {
    //       // lineSegments.geometry.colors[index].setRGB(this.neighbors[i].edgeColor);
    //       lineSegments.geometry.colors[index].setRGB(this.neighbors[i].edgeColor.r, this.neighbors[i].edgeColor.g, this.neighbors[i].edgeColor.b);
    //     }
    //     lineSegments.geometry.colorsNeedUpdate = true;
    //   }
    // }
    /** Clearing array of neighbors */
    this.neighbors = [];
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
  // console.log("sourcePos:");
  // console.log(sourcePos);
  // console.log("targetPos:");
  // console.log(targetPos);
  // console.log("layout:");
  // console.log(layout);
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
    /** Get meshes */
    var previousMeshNumber = parseInt(intersection.object.name[intersection.object.name.length-1]) + 1;
    var originalMeshName = intersection.object.name.substring(0, intersection.object.name.length-1);
    if(isNaN(previousMeshNumber)) previousMeshNumber = "h1";
    // var currentMesh = scene.getObjectByName(intersection.object.name);
    var previousMesh = scene.getObjectByName(originalMeshName + previousMeshNumber.toString());
    if(previousMesh != undefined)
    {
      /** Get array of predecessors */
      var startFace = intersection.faceIndex-(intersection.face.a-intersection.face.c)+1;
      var properties = JSON.parse(intersection.object.geometry.faces[startFace].properties);
      // console.log("intersection.object.geometry.faces[startFace].position:");
      // console.log(intersection.object.geometry.faces[startFace].position);
      var edgeGeometry = new THREE.Geometry();
      var sourcePos = intersection.object.geometry.faces[startFace].position;
      var v1 = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
      /** Color vertexes */
      for(var j = 0; j < 32; j++)
      {
        intersection.object.geometry.faces[startFace+j].color.setRGB(1.0, 0.0, 0.0);
      }
      intersection.object.geometry.colorsNeedUpdate = true;
      this.neighbors.push({vertexInfo: parseInt(JSON.parse(intersection.object.geometry.faces[startFace].properties).id), mesh: intersection.object.name});
      /** Color predecessors */
      for(pred in properties)
      {
        if(pred == "predecessor")
        {
          var predecessors = properties[pred].split(",");
          for(var i = 0; i < predecessors.length; i++)
          {
            if(previousMesh.geometry.faces[(parseInt(predecessors[i]))*32] !== undefined)
            {
              /** Color predecessors */
              var targetPos = previousMesh.geometry.faces[(parseInt(predecessors[i]))*32].position;
              /** Check if predecessor vertexes were rendered */
              if(this.wasRendered(sourcePos, targetPos, layout))
              {
                this.neighbors.push({vertexInfo: parseInt(predecessors[i]), mesh: previousMesh.name});
                var v2 = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
                for(var j = 0; j < 32; j++)
                {
                  previousMesh.geometry.faces[(parseInt(predecessors[i]))*32 + j].color.setRGB(1.0, 0.0, 0.0);
                }
                edgeGeometry.vertices.push(v1);
                edgeGeometry.vertices.push(v2);
              }
            }
          }
        }
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
      lineSegments.name = "parentConnections";
      scene.add(lineSegments);

      edgeGeometry.dispose();
      edgeGeometry = null;
      edgeMaterial.dispose();
      edgeMaterial = null;
    }
  }
  else
  {
    this.clicked.wasClicked = false;
    scene.remove(scene.getObjectByName("parentConnections"));
    for(var i = 0; i < this.neighbors.length; i++)
    {
      var mesh = scene.getObjectByName(this.neighbors[i].mesh);
      for(var j = 0; j < 32; j++)
      {
        mesh.geometry.faces[(this.neighbors[i].vertexInfo*32)+j].color.setRGB(0.0, 0.0, 0.0);
        mesh.geometry.colorsNeedUpdate = true;
      }
    }
    /** Clearing array of neighbors */
    this.neighbors = [];
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
  /* Execute ray tracing */
  var intersects = this.configAndExecuteRaytracing(evt, renderer, scene);
  var intersection = intersects[0];
  if(intersection != undefined)
  {
    /** Delete vertex info from vueTableHeader and vueTableRows */
    if(vueTableHeader._data.headers != "")
    {
      vueTableHeader._data.headers = "";
    }
    if(vueTableRows._data.rows != "")
    {
      vueTableRows._data.rows = "";
    }
    if(intersection.object.name == "MainMesh")
    {
      this.showNeighbors(scene);
    }
    this.showParents(intersection, scene, layout);
    // else
    // {
    //   this.showParents(intersection, scene);
    // }
  }
  else
  {
    this.showNeighbors(scene);
    this.showParents(intersection, scene, layout);
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
      // for(var j = 0; vertices.vertexes !== undefined && j < vertices.vertexes.length; j++)
      for(var j = 0; j < vertices.length/** vertices.vertexes.length */; j++)
      {
        if(j == 0)
        {
          // for(key in vertices.vertexes[j])
          for(key in vertices[j])
          {
            vertexVueHeaders.push(key);
          }
          // console.log("vertexVueHeaders:");
          // console.log(vertexVueHeaders);
          /** Construct a new vue table header */
          vueTableHeader._data.headers = vertexVueHeaders;
        }
        // vertexVueRows.push(vertices.vertexes[j]);
        vertexVueRows.push(vertices[j]);
      }
      /** Construct a new vue table data */
      vueTableRows._data.rows = vertexVueRows;
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
          return elmt.vertexInfo == el;
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
        /** Do nothing - TODO for now */
        /** Remove tooltip from highlighting */
        this.d3Tooltip.hideTooltip();
      }
    }
}
