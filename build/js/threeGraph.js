/**
 * Singleton base class for depth of the scene.
 * Author: Diego S. Cintra
 */
var Depth = (function (){

        // Instance stores a reference to the Singleton
        var instance;

        // Singleton
        function init(z2)
        {
            // Private methods and variables
            var z = z2;

            return{

                // Public methods and variables
                /**
                 * Getter of z
                 */
                getZ : function()
                {
                    return z;
                },

                /**
                * Setter of z
                */
                setZ : function(z)
                {
                    this.z = z;
                }

            };

        };

        return{

            // Get the Singleton instance if one exists
            // or create one if it doesn't
            getInstance: function (z2) 
            {
                if ( !instance ) {
                    instance = init(z2);
                }

                return instance;
            }

        };

})();

/**
 * Constructor
 * params:
 *    - z: Depth to be applied in every element of the scene.
 */
// function Depth(z)
// {
//     this.z = z;
// }

/**
 * Constructor
 * params:
 *    - edgeObject: the edge object taken from the JSON file;
 *    - bufferGeometry: a generic bufferGeometry (from three.js);
 *    - lineBasicMaterial: line material for the object (from three.js).
 */
var Edge = function(edgeObject, min, max, bufferGeometry, lineBasicMaterial)
{
    /* Pre ECMAScript 2015 standardization */
    // min = typeof min !== 'undefined' ? min : 0;
    // max = typeof max !== 'undefined' ? max : 50;
    min = ecmaStandard(min, 0);
    max = ecmaStandard(max, 50);
    bufferGeometry = typeof bufferGeometry !== 'undefined' ? bufferGeometry : undefined;
    lineBasicMaterial = typeof lineBasicMaterial !== 'undefined' ? lineBasicMaterial : undefined;
    try
    {
        this.edgeObject = edgeObject;
        /* Defining edge id by concatenation of source and target nodes' id */
        this.edgeObject.id = "e" + edgeObject.source.toString() + edgeObject.target.toString();
    }
    catch(err)
    {
        throw "Constructor must have edgeObject type as first parameter! " +
        " Constructor " +
            " params: " +
            "    - edgeObject: the edge object taken from the JSON file; " +
            "    - bufferGeometry: a generic bufferGeometry (from three.js); " +
            "    - lineBasicMaterial: line material for the object (from three.js).";
    }
    finally
    {
        if(this.edgeObject.weight == undefined)
        {
            this.edgeObject.weight = 1;
        }

        /* Use feature scaling to fit edges */
        this.edgeRadius = (this.edgeObject.weight - min)/(max-min);
        if(bufferGeometry != undefined && lineBasicMaterial == undefined)
        {
            this.bufferGeometry = bufferGeometry;
            this.lineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x8D9091, side: THREE.DoubleSide});
        }
        else if(bufferGeometry == undefined && lineBasicMaterial != undefined)
        {
            this.bufferGeometry = new THREE.BufferGeometry();
            this.lineBasicMaterial = lineBasicMaterial;
        }
        else if(bufferGeometry != undefined && lineBasicMaterial != undefined)
        {
            this.bufferGeometry = bufferGeometry;
            this.lineBasicMaterial = lineBasicMaterial;
        }
        else
        {
            this.bufferGeometry = new THREE.BufferGeometry();
            this.lineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x8D9091, side: THREE.DoubleSide});
        }

        /* TODO - eliminates ray tracing completely */
        // this.geometry.computeBoundingSphere();
        // this.geometry.computeFaceNormals();
        // this.geometry.boundingBox = null;
        // this.geometry.verticesNeedUpdate = true;
        // this.geometry.computeLineDistances();
        // this.geometry.computeBoundingBox();
        // this.geometry.computeFlatVertexNormals();
        // this.geometry.computeLineDistances();
        // this.geometry.computeMorphNormals();
        // this.geometry.verticesNeedUpdate = true;
    }
}

/**
 * Getter for edge - COPY, NOT REFERENCE
 */
Edge.prototype.getEdge = function()
{
    var edge = new Edge();
    edge.setBufferGeometry(this.circleBufferGeometry);
    edge.setLineBasicMaterial(this.lineBasicMaterial);
    edge.setLine(this.line);
    return edge;
}

/**
 * Sets the current edge with new edge attributes
 * param:
 *    - Edge: edge for copying.
 */
Edge.prototype.setEdge = function(edge)
{
    this.setBufferGeometry(edge.bufferGeometry);
    this.setlineBasicMaterial(edge.setlineBasicMaterial);
    this.setLine(edge.line);
}

/**
 * Getter for bufferGeometry
 */
Edge.prototype.getBufferGeometry = function()
{
    return this.bufferGeometry;
}

/**
 * Setter for bufferGeometry
 */
Edge.prototype.setBufferGeometry = function(bufferGeometry)
{
    this.bufferGeometry = bufferGeometry;
}

/**
 * Getter for lineBasicMaterial
 */
Edge.prototype.getlineBasicMaterial = function()
{
    return this.lineBasicMaterial;
}

/**
 * Setter for lineBasicMaterial
 */
Edge.prototype.setlineBasicMaterial = function(lineBasicMaterial)
{
    this.lineBasicMaterial = lineBasicMaterial;
}

/**
 * Getter for line
 */
Edge.prototype.getLine = function()
{
    return this.line;
}

/**
 * Setter for line
 */
Edge.prototype.setLine = function(line)
{
    this.line = line;
}

/**
 * Build the edge into the scene
 * params:
 *    - source: source node from which the edge starts (if directed);
 *    - target: target node from which the edge ends (if dirceted).
 */
Edge.prototype.buildEdge = function(source, target)
{
    var sourcePos = source.getCircle().position;
    var targetPos = target.getCircle().position;
    this.bufferGeometry = new THREE.BufferGeometry();
    var path = new Float32Array([
        sourcePos.x, sourcePos.y, sourcePos.z,

        targetPos.x, targetPos.y, targetPos.z
    ]);
    this.bufferGeometry.addAttribute('position', new THREE.BufferAttribute( path, 3 ));
    // this.bufferGeometry.computeFaceNormals();
    // this.bufferGeometry.computeVertexNormals();
    // this.bufferGeometry.computeBoundingSphere();
    this.line = new THREE.Line(this.bufferGeometry, this.lineBasicMaterial);
    this.line.name = "e" + this.edgeObject.source+this.edgeObject.target;
    this.line.boundingBox = null;
    this.line.renderOrder = 0;
}

/**
 * Highlight edge
 */
Edge.prototype.highlight = function()
{
    this.line.material.color.setHex(0xFF0000);
}

/**
 * Unhighlight edge
 */
Edge.prototype.unhighlight = function()
{
    this.line.material.color.setHex(0x8D9091);
}

/**
* Constructor
* params:
*    - graph: object containing JSON graph file, with:
*      - graphInfo: object containing information such as:
*              1) if the graph is directed;
*              2) which multilevel is;
*              3) the number of layers;
*              4) n integers, each containing the number of nodes in a layer.
*      - nodes: array of Node type;
*      - edges: array of Edge type.
*    - layout: enum containing layout of graph. Can be:
*      - 1) Force-directed;
*      - 2) Radial;
*      - 3) Bipartite.
*    - min: the minimal value for feature scaling, applied to nodes and edges. Default is 0
*    - max: the maximum value for feature scaling, applied to nodes and edges. Default is 10
*/
var Graph = function(graph, layout, min, max)
{
   /* Pre ECMAScript2015 standardization */
   // layout = typeof layout !== 'undefined' ? layout : 2;
   // min = typeof min !== 'undefined' ? min : 0;
   // max = typeof max !== 'undefined' ? max : 10;
   layout = ecmaStandard(layout);
   min = ecmaStandard(min);
   max = ecmaStandard(max);
   try
   {
       this.layout = layout;
       this.graphInfo = graph.graphInfo[0];
       if(this.graphInfo.vlayer != undefined)
       {
           this.firstLayer = this.graphInfo.vlayer.split(" ");
           this.firstLayer = this.firstLayer[0];
           this.lastLayer = this.graphInfo.vlayer.split(" ");
           this.lastLayer = this.lastLayer[this.lastLayer.length-1];
       }
       else
       {
           this.firstLayer = this.lastLayer =  Math.floor(graph.nodes.length / 2);
       }
       this.graphInfo.min = min;
       this.graphInfo.max = max;
       if(graph.nodes instanceof Array)
       {
           this.nodes = [];
           for(var i = 0; i < graph.nodes.length; i++)
           {
               this.nodes[i] = new Node(graph.nodes[i], min, max);
           }
           // graph.nodes.forEach(function(d, i){
           //     this.nodes[i] = new Node(d);
           // });
       }
       if(graph.links instanceof Array)
       {
           this.edges = [];
           for(var i = 0; i < graph.links.length; i++)
           {
               this.edges[i] = new Edge(graph.links[i]);
           }
           // graph.edges.forEach(function(d, i){
           //     this.edges[i] = new Edge(d);
           // })
       }
   }
   catch(err)
   {
       throw "Unexpected error ocurred at line " + err.lineNumber + ", in function Graph. " + err;
   }
}

/**
* Get element by id
* param:
*    - id: element id.
*/
Graph.prototype.getElementById = function(id)
{
   var identification = id.slice(0,1);
   if(identification == "e") // edge
   {
       return this.getEdgeById(id);
   }
   else // node
   {
       return this.getNodeById(id);
   }
}

/**
* Get nodes from graph
*/
Graph.prototype.getNodes = function()
{
   return this.nodes;
}

/**
* Get nodes meshes
*/
Graph.prototype.getNodesMeshes = function()
{
   var meshes = [];
   for(var i = 0; i < this.nodes.length; i++)
   {
       meshes.push(this.nodes[i].getCircle());
   }
   return meshes;
}

/**
* Get specific node from graph by id
* param:
*    - id: node id.
*/
Graph.prototype.getNodeById = function(id)
{
   return this.getNodeByIndex(this.findNode(id));
}

/**
* Find node by id
* param:
*    - id: node id.
*/
Graph.prototype.findNode = function(id)
{
   for(var i = 0; i < this.nodes.length; i++)
   {
       if(this.nodes[i].nodeObject.id == id)
       {
           return i;
       }
   }
   return -1;
}

/**
* Get specific node from graph by index
* param:
*    - i: index from array of nodes in "Graph" class.
*/
Graph.prototype.getNodeByIndex = function(i)
{
   return i != -1 ? this.nodes[i] : "Node not found.";
}

/**
* Get number of nodes from graph
*/
Graph.prototype.getNumberOfNodes = function()
{
   return this.nodes.length;
}

/**
* Set node by id
* param:
*    - id: node id;
*    - node: object to be assigned.
*/
Graph.prototype.setNodeById = function(id, node)
{
   var index = this.findNode(id);
   this.nodes[index].setNode(node);
}

/**
* Get edges from graph
*/
Graph.prototype.getEdges = function()
{
   return this.edges;
}

/**
* Get edges meshes
*/
Graph.prototype.getEdgesMeshes = function()
{
   var meshes = [];
   for(var i = 0; i < this.edges.length; i++)
   {
       meshes.push(this.edges[i].getLine());
   }
   return meshes;
}

/**
* Get specific edge from graph by id
* params:
*    - id: edge id.
*/
Graph.prototype.getEdgeById = function(id)
{
   return this.getEdgeByIndex(this.findEdge(id));
}

/**
* Find edge by id
* param:
*    - id: edge id.
*/
Graph.prototype.findEdge = function(id)
{
   for(var i = 0; i < this.edges.length; i++)
   {
       if(this.edges[i].edgeObject.id == id)
       {
           return i;
       }
   }
   return -1;
}

/**
* Get specific edge from graph by index
* param:
*    - i: index from array of edges in "Graph" class.
*/
Graph.prototype.getEdgeByIndex = function(i)
{
   return i != -1 ? this.edges[i] : "Edge not found.";
}

/**
* Get specific edge from graph by index
* param:
*    - i: index from array of edges in "Graph" class.
*/
Graph.prototype.getEdgeByIndex = function(i)
{
   return this.edges[i];
}

/**
* Get number of edges from graph
*/
Graph.prototype.getNumberOfEdges = function()
{
   return this.edges.length;
}

/**
* Set edge by id
* param:
*    - id: edge id;
*    - edge: object to be assigned.
*/
Graph.prototype.setEdgeById = function(id, edge)
{
   var index = this.findEdge(id);
   this.edges[index].setEdge(edge);
}

/**
* Builds the graph in the scene. All the node and edge calculations are performed, and the elements added
* params:
*    - scene: the scene in which the graph will be built;
*    - layout: graph layout. Default is 2 = radial.
*/
Graph.prototype.buildGraph = function(scene, layout)
{
   layout = ecmaStandard(layout, 3);
   scene = ecmaStandard(scene, undefined);
   try
   {
       var scale, theta;
       /* From D3, use a scaling function for placement */
       scale = d3.scaleLinear().domain([0, (this.getNumberOfNodes())]).range([0, 2 * Math.PI]);

       /* Build nodes' meshes */
       var j = this.lastLayer;
       for(var i = 0; i < this.nodes.length; i++)
       {
           if(layout == 2) theta = scale(i);
           else if(layout == 3) theta = 3;
           this.nodes[i].buildNode(i, 0, this.firstLayer, j, 10, theta, layout);
           if(scene !== undefined) scene.add(this.nodes[i].getCircle());
           j = parseInt(j) + parseInt(theta);
       }

       /* Build edges' meshes and add to scene */
       for(var i = 0; i < this.edges.length; i++)
       {
           this.edges[i].buildEdge(this.getNodeById(this.edges[i].edgeObject.source), this.getNodeById(this.edges[i].edgeObject.target)); //this.graphInfo.min, this.graphInfo.max
           // var helper = new THREE.FaceNormalsHelper(this.edges[i].getLine());
           // scene.add(helper);
           if(scene !== undefined) scene.add(this.edges[i].getLine());
       }
   }
   catch(err)
   {
       throw "Unexpected error ocurred at line " + err.line + ". " + err;
   }
}

/**
 * Constructor
 * params:
 *    - circleGeometry: a geometry of type circle (from three.js);
 *    - meshBasicMaterial: material for the geometry (from three.js).
 *
function Node(circleGeometry, meshBasicMaterial)
{
    this.circleGeometry = circleGeometry;
    this.meshBasicMaterial = meshBasicMaterial;
}*/

/**
 * Constructor
 * params:
 *    - nodeObject: the node object taken from the JSON file;
 *    - min: min value to be used in feature scaling;
 *    - max: max value to be used in feature scaling;
 *    - circleGeometry: a geometry of type circle (from three.js);
 *    - meshBasicMaterial: material for the geometry (from three.js).
 */
var Node = function(nodeObject, min, max, circleGeometry, meshBasicMaterial)
{
    min = ecmaStandard(min, 0);
    max = ecmaStandard(max, 10);
    circleGeometry = ecmaStandard(circleGeometry, undefined);
    meshBasicMaterial = ecmaStandard(meshBasicMaterial, undefined);
    try
    {
        // CHANGED - INCLUDED this.nodeObject; REMOVED this.id, this.weight
        this.nodeObject = nodeObject;
        //this.id = toInt(nodeObject.id);
        //this.weight = toInt(nodeObject.weight);
    }
    catch(err)
    {
        throw "Constructor must have nodeObject type as first parameter! " +
        " Constructor " +
            " params: " +
            "    - nodeObject: the node object taken from the JSON file; " +
            "    - circleGeometry: a geometry of type circle (from three.js); " +
            "    - meshBasicMaterial: material for the geometry (from three.js).";
    }
    finally
    {
        // CHANGED - FROM this.weight TO this.nodeObject.weight
        if(this.nodeObject.weight == undefined)
        {
            this.nodeObject.weight = 1;
        }

        /* Use feature scaling to fit nodes */
        var x = (this.nodeObject.weight - min)/(max-min) + 1.5;
        this.circleGeometry = new THREE.CircleGeometry(x, 100);

        /* Store number of nodes from each layer */

        if(meshBasicMaterial == undefined)
        {
            this.meshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, depthFunc: THREE.AlwaysDepth });
        }
        else
        {
            this.meshBasicMaterial = meshBasicMaterial;
        }
        this.circle = new THREE.Mesh(this.circleGeometry, this.meshBasicMaterial);
        this.circle.name = "" + this.nodeObject.id;
        this.circle.geometry.computeFaceNormals();
        this.circle.geometry.computeBoundingBox();
        this.circle.geometry.computeBoundingSphere();
        // this.circle.geometry.boundingBox = null;
        this.circle.geometry.verticesNeedUpdate = true;
        this.circle.renderOrder = 1;
    }
}

/**
 * Define constructor

Node.prototype.constructor = Node;
*/

/**
 * Getter for node - COPY, NOT REFERENCE
 */
Node.prototype.getNode = function()
{
    var node = new Node();
    node.setCircleGeometry(this.circleGeometry);
    node.setMeshBasicMaterial(this.meshBasicMaterial);
    node.setCircle(this.circle);
    return node;
}

/**
 * Sets the current node with new node attributes
 * param:
 *    - node: node for copying.
 */
Node.prototype.setNode = function(node)
{
    this.setCircleGeometry(node.circleGeometry);
    this.setMeshBasicMaterial(node.meshBasicMaterial);
    this.setCircle(node.circle);
}

/**
 * Getter for circleGeometry
 */
Node.prototype.getCircleGeometry = function()
{
    return this.circleGeometry;
}

/**
 * Setter for circleGeometry
 */
Node.prototype.setCircleGeometry = function(circleGeometry)
{
    this.circleGeometry = circleGeometry;
}

/**
 * Getter for meshBasicMaterial
 */
Node.prototype.getMeshBasicMaterial = function()
{
    return this.meshBasicMaterial;
}

/**
 * Setter for meshBasicMaterial
 */
Node.prototype.setMeshBasicMaterial = function(meshBasicMaterial)
{
    this.meshBasicMaterial = meshBasicMaterial;
}

/**
 * Getter for circle
 */
Node.prototype.getCircle = function()
{
    return this.circle;
}

/**
 * Setter for circle
 */
Node.prototype.setCircle = function(circle)
{
    this.circle = circle;
}

/**
 * Build the node into the scene
 * params:
 *    - index: index of current node;
 *    - lastIndex: index of second (or last) layer;
 *    - firstLayer: number of nodes in first layer of bipartite graph;
 *    - lastLayer: number of nodes in second (or last) layer of bipartite graph;
 *    - alpha: value used in bipartite layout;
 *    - layout: the graph layout;
 *    - theta: used in the parametric equation of radial layout.
 */
Node.prototype.buildNode = function(index, lastIndex, firstLayer, lastLayer, alpha, theta, layout)
{
    switch(layout)
    {
        case 1: // Force-directed layout
            this.buildForceDirected();
            break;
        case 2: // Radial layout
            this.buildRadial(theta);
            break;
        case 3: // Bipartite layout
            this.buildBipartite(index, lastIndex, firstLayer, lastLayer, alpha, theta);
            break;
        default:
            break;
    }
}

/**
 * Build a node into the scene, using a force directed layout
 */
Node.prototype.buildForceDirected = function()
{
    console.log("To be implemented");
}

/**
 * Build a node into the scene, using a radial layout
 * param:
 *    - theta: used in the parametric equation of radial layout.
 */
Node.prototype.buildRadial = function(theta)
{
    /* Parametric equation of a circle */
    var x = 15.00000 * Math.sin(theta);
    var y = 15.00000 * Math.cos(theta);
    // console.log("x: " + x);
    // console.log("y: " + y);
    this.circle.position.set(x, y, 0);
}

/**
 * Build a node into the scene, using a bipartite layout
 * params:
 *    - index: index of node being positioned;
 *    - lastIndex: index of second (or last) layer;
 *    - firstLayer: number of nodes in first layer of bipartite graph;
 *    - lastLayer: number of nodes in second (or last) layer of bipartite graph;
 *    - alpha: value for spacing of parallel lines;
 *    - theta: used for bipartite layout.
 */
Node.prototype.buildBipartite = function(index, lastIndex, firstLayer, lastLayer, alpha, theta)
{
    /* Separate vertical lines according to number of layers */
    if(index >= firstLayer)
    {
        var x = alpha;
        index = (Math.abs( firstLayer - lastLayer ) / 2) - firstLayer;
        // console.log("------------------------------------");
        // console.log("firstLayer: " + firstLayer);
        // console.log("index: " + index);
        // console.log("lastLayer: " + lastLayer);
        // console.log("------------------------------------");
        // index = Math.round(index / lastLayer) + lastIndex;
    }
    else
    {
        var x = alpha * (-1);
    }
    y = index * theta;
    console.log("------------------------------------");
    console.log("y: " + y);
    console.log("------------------------------------");
    this.circle.position.set(x, y, 0);
}

/**
 * Highlight node
 */
Node.prototype.highlight = function()
{
    this.circle.material.color.setHex(0xFF0000);
}

/**
 * Unhighlight node
 */
Node.prototype.unhighlight = function()
{
    this.circle.material.color.setHex(0x000000);
}

function build(data)
{
  var scene, renderer;
  /* Converting text string to JSON */
  var jason = JSON.parse(data);

  /* Instantiating Graph */
  var graph = new Graph(jason, 2, 10, 70);
  //console.log(graph);

  /* Checking for WebGL compatibility */
  // if(Detector.webgl)
  // {
  //     console.log("WebGL supported");
  //     renderer = new THREE.WebGLRenderer({antialias:true});
  //
  //     // If its not supported, instantiate the canvas renderer to support all non WebGL
  //     // browsers
  // }
  // else
  // {
  //     console.log("WebGL not supported");
  //     renderer = new THREE.CanvasRenderer();
  // }

  renderer = new THREE.WebGLRenderer({antialias:true});

  /* Set the background color of the renderer to black, with full opacity */
  renderer.setClearColor("rgb(255, 255, 255)", 1);

  /* Get the size of the inner window (content area) to create a full size renderer */
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;

  /* Set the renderers size to the content areas size */
  renderer.setSize(canvasWidth, canvasHeight);

  // renderer.sortObjects = false;

  /* Get the DIV element from the HTML document by its ID and append the renderers DOM object to it */
  document.getElementById("WebGL").appendChild(renderer.domElement);

  /* Create the scene */
  scene = new THREE.Scene();

  /* Create the camera and associate it with the scene */
  camera = new THREE.PerspectiveCamera(120, canvasWidth / canvasHeight, 1, 500);
  /* Setting Z value so that every element will have the same depth */
  //  setZ(10);
  camera.position.set(0, 0, 40);
  camera.lookAt(scene.position);
  camera.name = "camera";
  scene.add(camera);

  /* Create lights to associate with scene */
  var lights = [];
  lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
  lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
  lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );

  lights[ 0 ].position.set( 0, 2, 0 );
  lights[ 1 ].position.set( 1, 2, 1 );
  lights[ 2 ].position.set( - 1, - 2, - 1 );

  scene.add( lights[ 0 ] );
  scene.add( lights[ 1 ] );
  scene.add( lights[ 2 ] );

  graph.buildGraph(scene, 3);

  /* Tell the browser to call this function when page is visible */
  // requestAnimationFrame(animateScene);

  /* Creating event listener */
  var eventHandler = new EventHandler(undefined, scene);

  // eventHandler.setScene(scene);

  /* Adding event listeners */
  // document.addEventListener('click', function(evt){eventHandler.clickEvent(evt, camera);}, false);
    document.addEventListener('mousedown', function(evt){eventHandler.mouseDownEvent(evt, camera);}, false);
  document.addEventListener('mousemove', function(evt){eventHandler.mouseMoveEvent(evt, renderer, graph);}, false);
    document.addEventListener('wheel', function(evt){eventHandler.wheelEvent(evt, camera); evt.preventDefault();}, false);

  animate();

  function animate()
  {
      requestAnimationFrame(animate);
      /* Render scene */
      renderer.render(scene, camera);
  }
  // var fs = new FileReader();
  /* Converting passed textarea input to JSON */
  // var jason = JSON.parse($.trim($("textarea").val()));
  // fs.onload = (function(data){
  // })(path);
}

/**
 * Base class for pre ECMAScript2015 standardization.
 * Author: Diego S. Cintra
 */
var ecmaStandard = function(variable, defaultValue)
{
  return variable !== undefined ? variable : defaultValue;
}

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
            graph.setNodeById(this.highlightedElements[i], element);
            d3.select("#name")
                .style("display", "none");
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
            /* Get name of node to display onscreen */
            d3.select("#name")
                .text(element.circle.name)
                .attr("font-family", "sans-serif")
                .attr("font-size", "20px")
                .style("display", "inline")
                .style("position", "absolute")
                .style("z-index", "1")
                .style("top", y)
                .style("left", x)
                .attr("fill", "green");
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

// /**
//   * Base class for building scene and performing preprocessing operations, such as node size and node positions.
//   * Author: Diego S. Cintra
//   */
//
// var Graph = require('../src/graph.js');
// var Node = require('../src/node.js');
// var Edge = require('../src/edge.js');
// var THREE = require('../../../node_modules/three/build/three.js');
//
// /**
//  * Constructor
//  * params:
//  *    - jsonFile: JSON graph
//  */
// var SceneBuilder = function(jsonFile)
// {
// 	/* Converting text string to JSON */
//     var jason = JSON.parse(jsonFile);
//
//     /* Instantiating Graph */
//     this.graph = new Graph(jason, 2, 10, 70);
//
//     /* Create the scene */
//     this.scene = new THREE.Scene();
//
//     /* Create lights to associate with scene */
//     var lights = [];
//     lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
//     lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
//     lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );
//
//     lights[ 0 ].position.set( 0, 2, 0 );
//     lights[ 1 ].position.set( 1, 2, 1 );
//     lights[ 2 ].position.set( - 1, - 2, - 1 );
//
//     this.scene.add( lights[ 0 ] );
//     this.scene.add( lights[ 1 ] );
//     this.scene.add( lights[ 2 ] );
// }
//
// SceneBuilder.prototype.build = function()
// {
//     /* Build graph */
//     // graph.buildGraph(scene);
//     this.graph.buildGraph();
//
//     /* Add graph elements to scene */
//     for(var i = 0; i < this.graph.getNumberOfNodes(); i++)
//     {
//     	this.scene.add(this.graph.getNodeByIndex(i).getCircle());
//     }
//     for(var i = 0; i < this.graph.getNumberOfEdges(); i++)
//     {
//     	this.scene.add(this.graph.getEdgeByIndex(i).getLine());
//     }
// }
//
// module.exports = SceneBuilder;

// /**
//  * Base class for tracking mouse object, used for debugging.
//  * Author: Diego S. Cintra
//  */
//
// /**
//  * Constructor which, by default, defines a triangleMesh
//  */
// var Tracker = function()
// {
//     this.triangleGeometry = new THREE.Geometry();
//     this.triangleGeometry.vertices.push(new THREE.Vector3( 0.0,  0.2, 0.0));
//     this.triangleGeometry.vertices.push(new THREE.Vector3(-0.2, -0.2, 0.0));
//     this.triangleGeometry.vertices.push(new THREE.Vector3( 0.2, -0.2, 0.0));
//     this.triangleGeometry.faces.push(new THREE.Face3(0, 1, 2));
//     this.triangleGeometry.faces[0].vertexColors[0] = new THREE.Color(0xFF0000);
//     this.triangleGeometry.faces[0].vertexColors[1] = new THREE.Color(0x00FF00);
//     this.triangleGeometry.faces[0].vertexColors[2] = new THREE.Color(0x0000FF);
//     this.triangleMaterial = new THREE.MeshBasicMaterial({
//         vertexColors:THREE.VertexColors,
//         side:THREE.DoubleSide
//     });
//     this.triangleMesh = new THREE.Mesh(this.triangleGeometry, this.triangleMaterial);
//     this.triangleMesh.name = "tracker";
// }
//
// /**
//  * Getter for mesh
//  */
// Tracker.prototype.getMesh = function()
// {
//     return this.triangleMesh;
// }
//
// /**
//  * Define tracker's position
//  * params:
//  *    - mouseX: x coordinate position;
//  *    - mouseY: y coordinate position.
//  */
// Tracker.prototype.setPos = function(mouseX, mouseY)
// {
//     this.triangleMesh.position.set(mouseX, mouseY, 0);
// }
//
// /**
//  * Make tracker follow mouse position
//  * params:
//  *    - mouseX: x coordinate position;
//  *    - mouseY: y coordinate position;
//  *    - camera: scene camera.
//  */
// Tracker.prototype.followMouse = function(mouseX, mouseY, camera)
// {
//     var vector = new THREE.Vector3(mouseX, mouseY, 0.5);
// 	vector.unproject( camera );
// 	var dir = vector.sub( camera.position ).normalize();
// 	var distance = - camera.position.z / dir.z;
// 	var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
// 	this.triangleMesh.position.copy(pos);
// }
//
// module.exports = Tracker;
