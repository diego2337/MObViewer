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
