/**
 * Base class for a Event handler, implementing Event interface.
 * @author Diego S. Cintra
 */

/**
 * Constructor
 * params:
 *    - raycaster: defined raycaster, defaults to creating a new one;
 *    - scene: scene in which the events will be manipulated.
 */
var EventHandler = function(raycaster, scene)
{
    this.raycaster = ecmaStandard(raycaster, new THREE.Raycaster());
    this.raycaster.linePrecision = 0.3;
    this.scene = ecmaStandard(scene, new THREE.Scene());
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

/**
 * Getter for scene
 */
EventHandler.prototype.getScene = function()
{
    return this.scene;
}

/**
 * Setter for scene
 */
EventHandler.prototype.setScene = function(scene)
{
    this.scene = scene;
}

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
 *    - clicked: boolean to indicate if element has already been clicked;
 *    - evt: event dispatcher;
 *    - graph: graph, containing objects to be intersected.
 */
EventHandler.prototype.mouseDoubleClickEvent = function(clicked, evt, graph)
{
  if(!clicked.wasClicked)
  {
    /* Find highlighted vertex and highlight its neighbors */
    for(var i = 0; i < this.highlightedElements.length; i++)
    {
      var element = graph.getElementById(this.highlightedElements[i]);
      if(element instanceof Node)
      {
        /* Search neighbors */
        this.neighbors = graph.findNeighbors(element);
        /* Add itself for highlighting */
        this.neighbors.push(element);
        /* Remove itself so it won't unhighlight as soon as mouse moves out */
        this.highlightedElements.splice(i, 1);
        /* Highlight neighbors */
        for(var j = 0; j < this.neighbors.length; j++)
        {
          if(this.neighbors[j] instanceof Node)
          {
            this.neighbors[j].highlight();
            clicked.wasClicked = true;
          }
        }
      }
    }
  }
  else if(clicked.wasClicked)
  {
    clicked.wasClicked = false;
    /* An element was already clicked and its neighbors highlighted; unhighlight all */
    for(var i = 0; i < this.neighbors.length; i++)
    {
      var element = undefined;
      if(this.neighbors[i] instanceof Node)
      {
        element = graph.getElementById(String(this.neighbors[i].circle.name));
        element.unhighlight();
      }
      else if(this.neighbors[i] instanceof Edge)
        element = graph.getElementById(String(this.neighbors[i].edgeObject.id));
    }
    /* Clearing array of neighbors */
    this.neighbors = [];
  }
}

/**
 * Handles mouse move. If mouse hovers over element, invoke highlighting
 * params:
 *    - evt: event dispatcher;
 *    - renderer: WebGL renderer, containing DOM element's offsets;
 *    - graph: graph, containing objects to be intersected.
 */
EventHandler.prototype.mouseMoveEvent = function(evt, renderer, graph)
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
    var camera = this.scene.getObjectByName("camera", true);

    /* Setting raycaster starting from camera */
    this.raycaster.setFromCamera(mouse, camera);

    /* Execute ray tracing */
    var intersects = this.raycaster.intersectObjects(this.scene.children, true);
    var intersection = intersects[0];

    /* Unhighlight any already highlighted element */
    for(var i = 0; i < this.highlightedElements.length; i++)
    {
        // var element = graph.getElementById(this.highlightedElements[i]);
        var element = this.scene.getObjectByName(this.highlightedElements[i], true);
        if(element != undefined)
        {
          element.material.color.setHex(0x000000);
        }
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
        this.highlightedElements.splice(i, 1);
    }
    /* Highlight element (if intersected) */
    if(intersection != undefined)
    {
        // var element = graph.getElementById(intersection.object.name);
        var element = this.scene.getObjectByName(intersection.object.name);
        element.material.color.setHex(0xFF0000);
        document.getElementById("graphID").innerHTML = element.name;
        if(element.description !== undefined)
          document.getElementById("graphDescription").innerHTML = element.description;
        else
          document.getElementById("graphDescription").innerHTML = "No description found.";
        this.highlightedElements.push(intersection.object.name);
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
        var element = this.scene.getObjectByName(this.highlightedElements[i], true);
        element.material.color.setHex(0x000000);
    }

    /* Clearing array of highlighted elements */
    this.highlightedElements = [];
}
