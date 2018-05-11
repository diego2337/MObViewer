/**
 * @desc Base class for abstraction of all elements in scene. Reponsible for rendering bipartite graph in scene, invoking functions to generate drawings, taking care of clearing and filling HTML page elements and invoking all objects in scene. TODO - to be implemented and modulated later
 * @author Diego Cintra
 * 1 May 2018
 */

/**
 * @constructor
 * @param {Object} renderer Renderer for three.js API.
 * @param {Object} scene Scene to be rendered by three.js API using renderer.
 */
var Layout = function(renderer, scene)
{
  this.renderer = ecmaStandard(renderer, undefined);
  this.scene = ecmaStandard(scene, undefined);
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
 * Connect vertexes from previous level to current level, according to .cluster file.
 * @param {Array} clusters .cluster file grouped as an array.
 * @param {Object} scene Scene to get meshes.
 * @param {int} outerBPLevel Outer bipartite graph level (previous coarsening level). Necessary to access proper mesh where such bipartite graph was built.
 * @param {int} outerBPLevel Inner bipartite graph level. Necessary to access proper mesh where such bipartite graph was built.
 * @param {string} meshNameSuffix Meshes names standard suffix.
 */
function connectLevels(clusters, scene, outerBPLevel, innerBPLevel, meshNameSuffix)
{
  /** Read char by char, storing numbers in an array */
  var clusterVertexes = clusters.toString().split("\n");
  /** Get specific meshes for each coarsened level */
  var outerMesh;
  parseInt(outerBPLevel) == 0 ? outerMesh = scene.getObjectByName(meshNameSuffix, true) : outerMesh = scene.getObjectByName(meshNameSuffix + outerBPLevel.toString(), true);
  var innerMesh;
  parseInt(innerBPLevel) == 0 ? innerMesh = scene.getObjectByName(meshNameSuffix, true) : innerMesh = scene.getObjectByName(meshNameSuffix + innerBPLevel.toString(), true);
  /** Iterate through clusterVertexes array, constructing edges between layers */
  var edgeGeometry = new THREE.Geometry();
  for(let i = 0, k = 0; i < innerMesh.geometry.faces.length && k < clusterVertexes.length; i = i + 32, k = k + 1)
  {
    var v1 = new THREE.Vector3(innerMesh.geometry.faces[i].position.x, innerMesh.geometry.faces[i].position.y, innerMesh.geometry.faces[i].position.z);
    var previousVertexes = clusterVertexes[k].split(" ");
    for(let j = 0; j < previousVertexes.length && outerMesh.geometry.faces[parseInt(previousVertexes[j])*32] !== undefined; j++)
    {
      var v2 = new THREE.Vector3(outerMesh.geometry.faces[parseInt(previousVertexes[j])*32].position.x, outerMesh.geometry.faces[parseInt(previousVertexes[j])*32].position.y, outerMesh.geometry.faces[parseInt(previousVertexes[j])*32].position.z);
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
  scene.add(lineSegments);

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
  var eventHandler;
  if(eventHandler === undefined)
  {
    eventHandler = new EventHandler(undefined);
    /* Adding event listeners */
    document.addEventListener('resize', function(evt){
      camera.aspect = document.getElementById(WebGL).clientWidth / document.getElementById(WebGL).clientHeight;
      camera.updateProjectionMatrix();
      this.renderer.setSize(document.getElementById(WebGL).clientWidth, document.getElementById(WebGL).clientHeight);
    }, false);
    document.addEventListener('mousemove', function(evt){eventHandler.mouseMoveEvent(evt, this.renderer, this.scene);}, false);
    document.addEventListener('dblclick', function(evt){
      eventHandler.mouseDoubleClickEvent();
      // eventHandler.mouseDoubleClickEvent(clicked, evt, bipartiteGraph);
      // !clicked ? clicked = true : clicked = false;
    }, false);
    document.addEventListener('click', function(evt){
      eventHandler.mouseClickEvent(evt, this.renderer, this.scene);
    }, false);
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
  if(this.renderer == undefined)
  {
      /* Get the size of the inner window (content area) to create a full size renderer */
      canvasWidth = (document.getElementById(mainSection).clientWidth);
      canvasHeight = (document.getElementById(mainSection).clientHeight);
      /* Create a new WebGL renderer */
      this.renderer = new THREE.WebGLRenderer({antialias:true});
      /* Set the background color of the renderer to black, with full opacity */
      this.renderer.setClearColor("rgb(255, 255, 255)", 1);
      /* Set the renderers size to the content area size */
      this.renderer.setSize(canvasWidth, canvasHeight);
  }
  else
  {
      this.renderer.setRenderTarget(null);
      this.renderer.clear();
  }

  /* Create scene */
  if(this.scene !== undefined)
  {
    // disposeHierarchy(this.scene, disposeNode);
    // for(var i = this.scene.children.length - 1; i >= 0; i--)
    // {
    //   this.scene.remove(this.scene.children[i]);
    // }
    // delete this.scene;
  }
  else
  {
    this.scene = new THREE.Scene();
  }

  /** Get DIV element from HTML document by its ID and append renderers' DOM object to it */
  document.getElementById(WebGL).appendChild(this.renderer.domElement);

  /* Create the camera and associate it with the scene */
  var camera = undefined;
  if(camera !== undefined) delete camera;
  camera = new THREE.PerspectiveCamera(120, canvasWidth / canvasHeight, 1, 2000);
  camera.position.set(0, 0, document.getElementById(mainSection).clientHeight/4);
  camera.lookAt(this.scene.position);
  camera.name = "camera";
  this.scene.add(camera);

  /* Create simple directional light */
  var light = undefined;
  if(light !== undefined) delete light;
  light = new THREE.DirectionalLight();
  light.position.set(0, 0, 10);
  this.scene.add(light);

  /* Using orbitControls for moving */
  if(controls !== undefined) delete controls;
  var controls = new THREE.OrbitControls(camera, this.renderer.domElement);

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
 * Build and render previous uncoarsened bipartite graphs.
 * @public
 * @param {JSON} jason .json file representing bipartiteGraph.
 * @param {string} graphName Current coarsened graph name.
 * @param {int} numOfLevels Current number of coarsened levels.
 * @param {string} numberOfVertices "id" attribute of HTML element indicating number of vertexes to be shown.
 * @param {string} numberOfEdges "id" attribute of HTML element indicating number of edges to be shown.
 * @param {string} nVerticesFirstLayer "id" attribute of HTML element indicating number of verticesw in first layer to be shown.
 * @param {string} nVerticesSecondLayer "id" attribute of HTML element indicating number of verticesw in second layer to be shown.
 */
Layout.prototype.buildAndRender = function(jason, graphName, numOfLevels, numberOfVertices, numberOfEdges, nVerticesFirstLayer, nVerticesSecondLayer)
{
  var bipartiteGraphs = [];
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
          displayGraphInfo(bipartiteGraphs[bipartiteGraphs.length-1], numberOfVertices, numberOfEdges, nVerticesFirstLayer, nVerticesSecondLayer);
        },
        xhr: loadGraph
      });
    }
    else
    {
      this.displayGraphInfo(jason, numberOfVertices, numberOfEdges, nVerticesFirstLayer, nVerticesSecondLayer);
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
      coarsenedBipartiteGraph.renderNodes(bipartiteGraphs[i], scene, lay, new IndependentSet(), new IndependentSet());
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
  var firstSet = data.firstSet;
  var secondSet = data.secondSet;
  var data = data.graph;
  var lay = ecmaStandard(layout, 2);
  var nVertexes = ecmaStandard(numberOfVertices, "numberOfVertices");
  var nEdges = ecmaStandard(numberOfEdges, "numberOfEdges");
  var nVertexesFirstLayer = ecmaStandard(nVerticesFirstLayer, "nVerticesFirstLayer");
  var nVertexesSecondLayer = ecmaStandard(nVerticesSecondLayer, "nVerticesSecondLayer");
  var mainSection = ecmaStandard(mainSectionID, "mainSection");
  var WebGL = ecmaStandard(WebGLID, "WebGL");
  var bipartiteGraph, gradientLegend;
  /** Convert string to JSON */
  var jason = JSON.parse(data);

  /** Remove any information from graphs */
  this.removeGraphInfo(nVertexes, nEdges, nVertexesFirstLayer, nVertexesSecondLayer);

  /** Instantiate renderer, scene, camera and lights, and configurate additional parameters */
  this.configAPIParams(mainSection, WebGL);

  /** Instantia* @param {string} numberOfVertices "id" attribute of HTML element indicating number of vertexes to be shown.
 * @param {string} numberOfEdges "id" attribute of HTML element indicating number of edges to be shown.
 * @param {string} nVerticesFirstLayer "id" attribute of HTML element indicating number of verticesw in first layer to be shown.
 * @param {string} nVerticesSecondLayer "id" attribute of HTML element indicating number of verticesw in second layer to be shown.te Graph */
  // if(bipartiteGraph !== undefined) delete bipartiteGraph;
  bipartiteGraph = new BipartiteGraph(jason, 8, "");

  /* Render bipartiteGraph */
  bipartiteGraph.renderGraph(jason, this.scene, lay);

  // if(bipartiteGraphs !== undefined) bipartiteGraphs = [];
  /** Build and render bipartite graphs from previous levels of coarsening */
  this.buildAndRender(jason, graphName, parseInt(numOfLevels), nVertexes, nEdges, nVertexesFirstLayer, nVertexesSecondLayer);

  delete jason;

  /** Create edge weights gradient legend */
  if(gradientLegend !== undefined)
  {
      gradientLegend.clear();
      delete gradientLegend;
  }
  /** Use minimum edge weight and maximum edge weight as domain values */
  gradientLegend = new GradientLegend(bipartiteGraph.linearScale, bipartiteGraph.graphInfo.minEdgeWeight, bipartiteGraph.graphInfo.maxEdgeWeight, 300, 50, 5);
  gradientLegend.createGradientLegend("gradientScale", "Edge weights:");

  animate(this.renderer, this.scene, camera);

  function animate(renderer, scene, camera)
  {
      /* Render scene */
      renderer.render(scene, camera);

      /* Tell the browser to call this function when page is visible */
      requestAnimationFrame(animate);

      /* Capture graph image (when requested) */
      if(capture)
      {
        capture = false;
        var dataURL = document.getElementsByTagName('canvas')[0].toDataURL('image/png');
        var wd = window.open('about:blank', 'graph');
        wd.document.write("<img src='" + dataURL + "' alt='from canvas'/>");
        wd.document.close();
      }
  }
}
