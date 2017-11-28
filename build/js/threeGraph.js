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
    max = ecmaStandard(max, 100);
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
            this.lineBasicMaterial = new THREE.LineBasicMaterial({linewidth: this.edgeRadius, color: 0x8D9091, side: THREE.DoubleSide});
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
            this.lineBasicMaterial = new THREE.LineBasicMaterial({linewidth: this.edgeRadius, color: 0x8D9091, side: THREE.DoubleSide});
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
*      - edges: array of Edge type;
*    - min: the minimal value for feature scaling, applied to nodes and edges. Default is 0
*    - max: the maximum value for feature scaling, applied to nodes and edges. Default is 10
*/
var Graph = function(graph, min, max)
{
   /* Pre ECMAScript2015 standardization */
   // layout = typeof layout !== 'undefined' ? layout : 2;
   // min = typeof min !== 'undefined' ? min : 0;
   // max = typeof max !== 'undefined' ? max : 10
   min = ecmaStandard(min);
   max = ecmaStandard(max);
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

       /* Set which type of bipartite graph to be built */
       if(layout == 2) theta = scale(i);
       /* TODO - fix theta size; Must be according to size of nodes */
       else if(layout == 3)
       {
         theta = 3;
       }

       /* Build nodes' meshes */
       //  var j = this.lastLayer;
       var j = 0;
      //  var singleGeometry = new THREE.Geometry();
       for(var i = 0; i < this.nodes.length; i++)
       {
           if(i == this.firstLayer)
           {
             theta = ((this.firstLayer / this.lastLayer)  * theta);
             j = parseInt(j) + parseInt(1);
           }
           else if(i > this.firstLayer)
           {
             j = parseInt(j) + parseInt(1);
           }
           this.nodes[i].buildNode(i, this.firstLayer, j, 20, theta, layout);
          //  this.nodes[i].getCircle().updateMatrix();
          //  singleGeometry.merge(this.nodes[i].getCircle().geometry, this.nodes[i].getCircle().matrix);
           if(scene !== undefined) scene.add(this.nodes[i].getCircle());
       }
      //  if(scene !== undefined)
      //  {
      //      var material = new THREE.MeshPhongMaterial({color: 0xFF0000});
      //      var mesh = new THREE.Mesh(singleGeometry, material);
      //      scene.add(mesh);
      //  }

      //  /* Build edges' meshes and add to scene */
      var singleGeometry2 = new THREE.Geometry();
      for(var i = 0; i < this.edges.length; i++)
      {
         this.edges[i].buildEdge(this.getNodeById(this.edges[i].edgeObject.source), this.getNodeById(this.edges[i].edgeObject.target)); //this.graphInfo.min, this.graphInfo.max
         // var helper = new THREE.FaceNormalsHelper(this.edges[i].getLine());
         // scene.add(helper);
         // this.edges[i].getLine().updateMatrix();
         // singleGeometry2.merge(this.edges[i].getLine().geometry, this.edges[i].getLine().matrix);
        if(scene !== undefined) scene.add(this.edges[i].getLine());
      }
      //  if(scene !== undefined)
      //  {
      //      var material = new THREE.MeshPhongMaterial({color: 0xFF0000});
      //      var mesh = new THREE.Mesh(singleGeometry2, material);
      //      scene.add(mesh);
      //  }
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
            this.meshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.FrontSide, depthFunc: THREE.AlwaysDepth });
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
 *    - firstLayer: number of nodes in first layer of bipartite graph;
 *    - lastLayer: number of nodes in second (or last) layer of bipartite graph;
 *    - alpha: value used in bipartite layout;
 *    - layout: the graph layout;
 *    - theta: used in the parametric equation of radial layout.
 */
Node.prototype.buildNode = function(index, firstLayer, lastLayer, alpha, theta, layout)
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
            this.buildBipartite(index, firstLayer, lastLayer, alpha, theta);
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
 *    - firstLayer: number of nodes in first layer of bipartite graph;
 *    - lastLayer: number of nodes in second (or last) layer of bipartite graph;
 *    - alpha: value for spacing of parallel lines;
 *    - theta: used for bipartite layout.
 */
Node.prototype.buildBipartite = function(index, firstLayer, lastLayer, alpha, theta)
{
    /* Separate vertical lines according to number of layers */
    if(index >= firstLayer)
    {
        var y = alpha;
        // index = (Math.abs( firstLayer - lastLayer ) / 2) - firstLayer;
        index = lastLayer;
        // index = Math.round(index / lastLayer) + lastIndex;
    }
    else
    {
        var y = alpha * (-1);
    }
    x = index * theta;
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

/* Global variables */
var renderer;
/**
  * Render a bipartite graph given a .json file
  * param:
  *    - data: .json file to be parsed into JSON notation and rendered
  */
function build(data)
{
  var scene;
  /* Converting text string to JSON */
  var jason = JSON.parse(data);

  /* Instantiating Graph */
  var graph = new Graph(jason, 10, 70);

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

  if(renderer == undefined)
  {
      /* Get the size of the inner window (content area) to create a full size renderer */
      // canvasWidth = (window.innerWidth) / 1.5;
      // canvasHeight = (window.innerHeight) / 1.5;
      canvasWidth = document.getElementById("WebGL").clientWidth;
      canvasHeight = document.getElementById("WebGL").clientHeight;

      /* Create a new WebGL renderer */
      renderer = new THREE.WebGLRenderer({antialias:true});
      /* Set the background color of the renderer to black, with full opacity */
      renderer.setClearColor("rgb(255, 255, 255)", 1);

      /* Set the renderers size to the content areas size */
      renderer.setSize(canvasWidth, canvasHeight);
  }
  else
  {
      renderer.clear();
  }

  // renderer.sortObjects = false;

  /* Get the DIV element from the HTML document by its ID and append the renderers DOM object to it */
  document.getElementById("WebGL").appendChild(renderer.domElement);

  /* Create scene */
  scene = new THREE.Scene();

  /* Build graph */
  graph.buildGraph(scene, 3);

  /* Create the camera and associate it with the scene */
  camera = new THREE.PerspectiveCamera(120, canvasWidth / canvasHeight, 1, 500);
  /* TODO - Setting Z value so that every element will have the same depth */
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

  /* Using orbitControls for moving */
  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  /* Setting up params */
  controls.minDistance = 1;
  controls.maxDistance = 500;
  controls.zoomSpeed = 1.5;
  controls.target.set(0, 0, 0);
  controls.enableRotate = false;
  controls.enableKeys = false;

  controls.mouseButtons = { PAN: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, ORBIT: THREE.MOUSE.RIGHT };


  /* Creating event listener */
  var eventHandler = new EventHandler(undefined, scene);

  // eventHandler.setScene(scene);

  /* Adding event listeners */
  document.addEventListener('mousemove', function(evt){eventHandler.mouseMoveEvent(evt, renderer, graph);}, false);
  /* Deprecated listeners - orbitControls taking care of zooming and panning */
  // document.addEventListener('click', function(evt){eventHandler.clickEvent(evt, camera);}, false);
  // document.addEventListener('mousedown', function(evt){eventHandler.mouseDownEvent(evt, camera);}, false);
  // document.addEventListener('wheel', function(evt){eventHandler.wheelEvent(evt, camera); evt.preventDefault();}, false);

  animate();

  function animate()
  {
      /* Tell the browser to call this function when page is visible */
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
