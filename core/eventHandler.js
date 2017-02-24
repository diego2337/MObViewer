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