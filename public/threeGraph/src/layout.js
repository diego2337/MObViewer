/**
 * @desc Base class for abstraction of all elements in scene. Reponsible for rendering bipartite graph in scene, invoking functions to generate drawings, taking care of clearing and filling HTML page elements and invoking all objects in scene. TODO - to be implemented and modulated later
 * @author Diego Cintra
 * 1 May 2018
 */

 /** @global Global variables must be declarated for redrawing to happen. */
 var globalRenderer, globalScene;

/**
 * @constructor
 */
var Layout = function()
{
  /** @desc Define trigger for saving a graph image in .png format */
  this.capture = false;
  /** @desc Define number of coarsened graphs in current visualization */
  this.numOfLevels = 0;
  /** @desc Define if gradient legend is already present */
  this.gradientLegend = undefined;
  /** @desc Define standard layout - (2) for horizontal bipartite graph, (3) for vertical bipartite graph */
  this.lay = 2;
  /** @desc Define events object */
  this.eventHandler = undefined;
  /** @desc Define vertexInfo object, to hold vertexes properties */
  this.vertexInfo = new VertexInfo();
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
  document.getElementById(numberOfVertices).innerHTML = "";
  document.getElementById(numberOfEdges).innerHTML = "";
  document.getElementById(nVerticesFirstLayer).innerHTML = "";
  document.getElementById(nVerticesSecondLayer).innerHTML = "";
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
  /** Store innerHTML elements in variables for consistency */
  var numOfVertexes = document.getElementById(numberOfVertices), vertexes;
  var numOfEdges = document.getElementById(numberOfEdges);
  var nVerticesFirstLayer = document.getElementById(nVerticesFirstLayer), firstLevel;
  var nVerticesSecondLayer = document.getElementById(nVerticesSecondLayer), secondLevel;
  /** Making necessary assignments according to information from graphInfo */
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
  /* Display number of vertices, edges, vertexes for first and second level separately */
  if(numOfVertexes.innerHTML == "")
  {
    numOfVertexes.innerHTML = vertexes;
    numOfEdges.innerHTML = parseInt(jason.graphInfo[0].edges);
    nVerticesFirstLayer.innerHTML = firstLevel;
    nVerticesSecondLayer.innerHTML = secondLevel;
  }
  else
  {
    numOfVertexes.innerHTML = numOfVertexes.innerHTML + "/" + vertexes;
    numOfEdges.innerHTML = numOfEdges.innerHTML + "/" + parseInt(jason.graphInfo[0].edges);
    nVerticesFirstLayer.innerHTML = nVerticesFirstLayer.innerHTML + "/" + firstLevel;
    nVerticesSecondLayer.innerHTML = nVerticesSecondLayer.innerHTML + "/" + secondLevel;
  }
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
      let outerIndex = parseInt(outerNodes['nodes'][pos].id)*32;
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

  if(this.eventHandler === undefined)
  {
    this.eventHandler = new EventHandler(undefined, "#" + WebGL, this.numOfLevels);
    var eventHandler = this.eventHandler;
    /* Adding event listeners */
    document.addEventListener('resize', function(evt){
      camera.aspect = document.getElementById(WebGL).clientWidth / document.getElementById(WebGL).clientHeight;
      camera.updateProjectionMatrix();
      globalRenderer.setSize(document.getElementById(WebGL).clientWidth, document.getElementById(WebGL).clientHeight);
    }, false);
    document.addEventListener('mousemove', function(evt){eventHandler.mouseMoveEvent(evt, globalRenderer, globalScene);}, false);
    document.addEventListener('dblclick', function(evt){
      eventHandler.mouseDoubleClickEvent(globalScene);
      // eventHandler.mouseDoubleClickEvent(clicked, evt, bipartiteGraph);
      // !clicked ? clicked = true : clicked = false;
    }, false);
    document.addEventListener('click', function(evt){
      eventHandler.mouseClickEvent(evt, globalRenderer, globalScene);
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
  canvasWidth = (document.getElementById(mainSection).clientWidth);
  canvasHeight = (document.getElementById(mainSection).clientHeight);
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
  for(let i = parseInt(numOfLevels); i >= 0; i = i - 1)
  {
    var gName = graphName.split(".")[0];
    gName = gName.substring(0, gName.length-2);
    i == 0 ? gName = gName.substring(0, gName.lastIndexOf('Coarsened')) + ".json" : gName = gName + "n" + (i).toString() + ".json";
    if(gName !== ".json")
    {
      $.ajax({
        async: false,
        url: '/getLevels',
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
  }
  /** Sort array */
  bipartiteGraphs.sort(function(a, b){
    if(a.graphInfo[0].graphSize < b.graphInfo[0].graphSize) return -1;
    else if(a.graphInfo[0].graphSize > b.graphInfo[0].graphSize) return 1;
    else return 0;
  });
  /** Render previous uncoarsened graphs */
  for(let i = bipartiteGraphs.length-1; i >= 0; i = i - 1)
  {
    var coarsenedBipartiteGraph;
    if(i != 0)
    {
      coarsenedBipartiteGraph = new BipartiteGraph(bipartiteGraphs[i], bipartiteGraph.distanceBetweenSets - (i+1), (i).toString());
      coarsenedBipartiteGraph.renderNodes(bipartiteGraphs[i], globalScene, lay, new IndependentSet(), new IndependentSet());
    }
    /** Connect super vertexes */
    if(i < bipartiteGraphs.length-1)
    {
      this.connectVertexes(bipartiteGraphs[i], bipartiteGraphs[i+1], i, i+1);
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
 * @param {string} nVerticesFirstLayer "id" attribute of HTML element indicating number of verticesw in first layer to be shown.
 * @param {string} nVerticesSecondLayer "id" attribute of HTML element indicating number of verticesw in second layer to be shown.
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
  this.numOfLevels = numOfLevels;
  var firstSet = data.firstSet;
  var secondSet = data.secondSet;
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
  bipartiteGraph.renderGraph(jason, globalScene, lay, this.vertexInfo);

  /** Build and render bipartite graphs from previous levels of coarsening */
  this.buildAndRenderCoarsened(bipartiteGraph, lay, jason, graphName, parseInt(numOfLevels), nVertexes, nEdges, nVertexesFirstLayer, nVertexesSecondLayer);

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

  animate();
}
