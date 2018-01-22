/**
 * Base class for a Event handler, implementing Event interface.
 * Author: Diego S. Cintra
 */

// var THREE = require('../../../node_modules/three/build/three.js');
// var ecmaStandard = require('../utils/ecmaStandard.js');

/**
 * Constructor
 * params:
 *    - raycaster: defined raycaster, defaults to creating a new one;
 *    - scene: scene in which the events will be manipulated.
 */
var EventHandler = function(raycaster, scene)
{
    /* Pre ECMAScript 2015 standardization */
    // raycaster = typeof raycaster !== 'undefined' ? raycaster : new THREE.Raycaster();
    // scene = typeof scene !== 'undefined' ? scene : new THREE.Scene();
    raycaster = ecmaStandard(raycaster, undefined);
    scene = ecmaStandard(scene, undefined);
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
 *    - camera: camera used in three.js scene visualization.
 */
// EventHandler.prototype.clickEvent = function(evt, camera)
// {
//     console.log(camera);
// }

/**
 * Handles dragging, which triggers panning
 * params:
 *    - evt: event dispatcher;
 *    - camera: camera used in three.js scene visualization.
 */
EventHandler.prototype.dragEvent = function(evt, camera)
{
    console.log("dragging");
}

/**
 * Handles mouse wheel. If mouse is scrolled up, zoom in; otherwise zoom out
 * params:
 *    - evt: event dispatcher;
 *    - camera: camera used in three.js scene visualization.
 */
EventHandler.prototype.wheelEvent = function (evt, camera)
{
    /* Check either scroll up or scroll down */
    if(evt.deltaY > 0)
    {
        /* Down scroll - decrease zoom */
        // console.log("Down scroll");
        if(camera.zoom - 4 > 0)
        {
            camera.zoom = camera.zoom - 4;
            camera.updateProjectionMatrix();
        }
    }
    else
    {
        /* Up scroll - increase zoom */
        // console.log("Up scroll");
        camera.zoom = camera.zoom + 4;
        camera.updateProjectionMatrix();
    }
}

/**
 * Handles mouse down. Initial function for dragging and camera panning
 * params:
 *    - evt: event dispatcher;
 *    - camera: camera used in three.js scene visualization.
 */
EventHandler.prototype.mouseDownEvent = function (evt, camera)
{
    /* Adapted from https://stackoverflow.com/questions/9047600/how-to-determine-the-direction-on-onmousemove-event */
    /* Object to store last position of cursor */
    var lastPosition = {};
    var cam = camera;
    document.onmouseup = function(evt){ document.onmousemove = null; document.onmouseup = null; }
    document.onmousemove = function(evt)
    {
        /* Compare with lastPosition */
        if(typeof(lastPosition.x) != undefined)
        {
            /* Get delta */
            var deltaX = lastPosition.x - evt.clientX;
            var deltaY = lastPosition.y - evt.clientY;
            /* Check direction */
            if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0)
            {
                /* Left */
                cam.position.x = cam.position.x + 2.5;
            }
            else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0)
            {
                /* Right */
                cam.position.x = cam.position.x - 2.5;
            }
            else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0)
            {
                /* Up */
                cam.position.y = cam.position.y - 2.5;
            }
            else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0)
            {
                /* Down */
                cam.position.y = cam.position.y + 2.5;
            }
        }
        /* Update last position */
        lastPosition = {
            x : evt.clientX,
            y : evt.clientY
        };
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
            // graph.setNodeById(this.highlightedElements[i], element);
            // d3.select("#name")
            //     .style("display", "none");
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
        console.log(element);
        element.highlight();
        if(element instanceof Node)
        {
            graph.setNodeById(intersection.object.name, element);
            document.getElementById("graphID").innerHTML = element.circle.name;
            if(element.circle.description !== undefined)
              document.getElementById("graphDescription").innerHTML = element.circle.description;
            else
              document.getElementById("graphDescription").innerHTML = "No description found.";
            /* Get name of node to display onscreen */
            // d3.select("#name")
            //     .text(element.circle.name)
            //     .attr("font-family", "sans-serif")
            //     .attr("font-size", "20px")
            //     .style("display", "inline")
            //     .style("position", "absolute")
            //     .style("z-index", "1")
            //     .style("top", y)
            //     .style("left", x)
            //     .attr("fill", "green");
        }
        else
        {
            graph.setEdgeById(intersection.object.name, element);
        }
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
