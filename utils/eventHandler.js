/**
 * Base class for a Event handler, implementing Event interface.
 * Author: Diego S. Cintra
 */

/**
 * Constructor
 * params:
 *    - raycaster: defined raycaster, defaults to creating a new one;
 *    - scene: scene in which the events will be manipulated.
 */
function EventHandler(raycaster = new THREE.Raycaster(), scene = new THREE.Scene())
{
    this.raycaster = new THREE.Raycaster();
    this.scene = scene;
    this.highlightedElements = [];
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
 * Handles clicking in scene
 * params:
 *    - evt: event dispatcher;
 *    - renderer: the WebGL renderer, containing DOM element's offsets;
 *    - graph: graph, containing objects to be intersected.
 */
EventHandler.prototype.clickEvent = function(evt, renderer, graph)
{
    /* Variable to store all the objects in the scene */
    var objects = [];
    /* Adjusting mouse coordinates to NDC [-1, 1] */
    var mouseX = (evt.clientX / renderer.domElement.clientWidth) * 2 - 1;
    var mouseY = -(evt.clientY / renderer.domElement.clientHeight) * 2 + 1;

    /* Merging objects arrays */
    objects = graph.getNodesMeshes().concat(graph.getEdgesMeshes());

    var mouse = new THREE.Vector2(mouseX, mouseY);
    var camera = this.scene.getObjectByName("camera", true);

    /* Setting raycaster starting from camera */
    this.raycaster.setFromCamera(mouse, camera);

    /* Execute ray tracing */
    var intersects = this.raycaster.intersectObjects(objects, true);

    /* Highlight elements */
    for(var i = 0; i < intersects.length; i++)
    {
        var element = graph.getElementById(intersects[i].object.name);
        element.highlight();
        if(element instanceof Node)
        {
            graph.setNodeById(intersects[i].object.name, element);
        }
        else
        {
            graph.setEdgeById(intersects[i].object.name, element);
        }
        this.highlightedElements.push(intersects[i].object.name);
    }
}

// function relMouseCoords(event){
//     var totalOffsetX = 0;
//     var totalOffsetY = 0;
//     var canvasX = 0;
//     var canvasY = 0;
//     var currentElement = this;

//     do{
//         totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
//         totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
//     }
//     while(currentElement = currentElement.offsetParent)

//     canvasX = event.pageX - totalOffsetX;
//     canvasY = event.pageY - totalOffsetY;

//     return {x:canvasX, y:canvasY}
// }
// HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

/**
 * Handles mouse move. If mouse hovers over element, invoke highlighting
 * params:
 *    - evt: event dispatcher;
 *    - renderer: WebGL renderer, containing DOM element's offsets;
 *    - graph: graph, containing objects to be intersected.
 */
EventHandler.prototype.mouseMoveEvent = function(evt, renderer, graph)
{
    /* DEBUG - Removes tracking object from scene, if there is any */
    // if(this.tracker != undefined)
    // {
    //     this.scene.remove(this.tracker.getMesh());
    // }

    /* Get canvas element and adjust x and y to element offset */
    var canvas = renderer.domElement.getBoundingClientRect();
    // var coords = renderer.domElement.relMouseCoords(evt);
    // var x = coords.x;
    // var y = coords.y;
    var x = evt.clientX - canvas.left;
    var y = evt.clientY - canvas.top;
    // console.log("x: " + x + " y: " + y);

    /* Adjusting mouse coordinates to NDC [-1, 1] */
    var mouseX = (x / renderer.domElement.clientWidth) * 2 - 1;
    var mouseY = -(y / renderer.domElement.clientHeight) * 2 + 1;
    // var mouseX = ((evt.clientX-renderer.domElement.offsetLeft) / renderer.domElement.clientWidth) * 2 - 1;
    // var mouseY = -((evt.clientY-renderer.domElement.offsetTop) / renderer.domElement.clientHeight) * 2 + 1;

    console.log("mouseX:");
    console.log(mouseX);
    console.log("mouseY:");
    console.log(mouseY);

    var mouse = new THREE.Vector2(mouseX, mouseY);
    var camera = this.scene.getObjectByName("camera", true);

    /* DEBUG - Adds tracking object */
    // this.tracker = new Tracker();
    // this.tracker.followMouse(mouseX, mouseY, camera);
    // this.scene.add(this.tracker.getMesh());

    /* Setting raycaster starting from camera */
    this.raycaster.setFromCamera(mouse, camera);

    /* Execute ray tracing */
    var intersects = this.raycaster.intersectObjects(this.scene.children, true);
    var intersection = intersects[0];

    /* Unhighlight any already highlighted element */
    for(var i = 0; i < this.highlightedElements.length; i++)
    {
        var element = graph.getElementById(this.highlightedElements[i]);
        element.unhighlight();
        if(element instanceof Node)
        {
            graph.setNodeById(this.highlightedElements[i], element);
        }
        else
        {
            graph.setEdgeById(this.highlightedElements[i], element);
        }
        this.highlightedElements.splice(i, 1);
    }
    /* Highlight element (if intersected) */
    if(intersection != undefined)
    {
        var element = graph.getElementById(intersection.object.name);
        element.highlight();
        if(element instanceof Node)
        {
            graph.setNodeById(intersection.object.name, element);
        }
        else
        {
            graph.setEdgeById(intersection.object.name, element);
        }
        this.highlightedElements.push(intersection.object.name);
    }

    /* Highlight elements (if any is intersected) */
    // for(var i = 0; i < intersects.length; i++)
    // {
    //     var element = graph.getElementById(intersects[i].object.name);
    //     element.highlight();
    //     if(element instanceof Node)
    //     {
    //         graph.setNodeById(intersects[i].object.name, element);
    //     }
    //     else
    //     {
    //         graph.setEdgeById(intersects[i].object.name, element);
    //     }
    //     this.highlightedElements.push(intersects[i].object.name);
    // }

    /* Set normal color for unhighlighted elements */
    // for(var i = 0; i < this.highlightedElements.length; i++)
    // {
    //     var element = graph.getElementById(this.highlightedElements[i]);
    //     element.unhighlight();
    //     if(element instanceof Node)
    //     {
    //         graph.setNodeById(this.highlightedElements[i], element);
    //     }
    //     else
    //     {
    //         graph.setEdgeById(this.highlightedElements[i], element);
    //     }
    //     this.highlightedElements.splice(i, 1);
    // }
}

/**
 * Handles hovering in an element
 * params:
 *    - evt: event dispatcher;
 *    - renderer: the WebGL renderer, containing DOM element's offsets;
 *    - graph: graph, containing objects to be intersected.
 */
EventHandler.prototype.mouseOverEvent = function(evt, renderer, graph)
{
    /* Variable to store all the objects in the scene */
    var objects = [];

    /* Adjusting mouse coordinates to NDC [-1, 1] */
    var mouseX = (evt.clientX / renderer.domElement.clientWidth) * 2 - 1;
    var mouseY = -(evt.clientY / renderer.domElement.clientHeight) * 2 + 1;

    /* Merging objects arrays */
    objects = graph.getNodesMeshes().concat(graph.getEdgesMeshes());

    var mouse = new THREE.Vector2(mouseX, mouseY);
    var camera = this.scene.getObjectByName("camera", true);

    /* Setting raycaster starting from camera */
    this.raycaster.setFromCamera(mouse, camera);

    /* Execute ray tracing */
    var intersects = this.raycaster.intersectObjects(objects, true);

    /* Highlight elements */
    for(var i = 0; i < intersects.length; i++)
    {
        var element = graph.getElementById(intersects[i].object.name);
        element.highlight();
        if(element instanceof Node)
        {
            graph.setNodeById(intersects[i].object.name, element);
        }
        else
        {
            graph.setEdgeById(intersects[i].object.name, element);
        }
        this.highlightedElements.push(intersects[i].object.name);
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
        var element = graph.getElementById(this.highlightedElements[i]);
        element.unhighlight();
        if(element instanceof Node)
        {
            graph.setNodeById(this.highlightedElements[i], element);
        }
        else
        {
            graph.setEdgeById(this.highlightedElements[i], element);
        }
    }

    /* Clearing array of highlighted elements */
    this.highlightedElements = [];
}