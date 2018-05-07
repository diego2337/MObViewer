/** Global variables */
var bipartiteGraph, gradientLegend, renderer, graph, scene, camera, light, controls, eventHandler, layout = 2, capture = false, clicked = {wasClicked: false}, graphName, numOfLevels = 0, firstSet, secondSet, bipartiteGraphs = [];
var cameraPos = document.getElementById("mainSection").clientHeight/4;
// var vueTableHeader, vueTableRows;
var vueTableHeader = new Vue({
  el: '#dynamicTableHeaders',
  data: {
    headers: ""
  }
});
var vueTableRows = new Vue({
  el: '#dynamicTableRows',
  data: {
    rows: ""
  }
});

/**
 * Display bipartiteGraph info on HTML page.
 * @public
 * @param {string} name Graph name from .json file.
 * @param {JSON} jason .json file representing bipartiteGraph.
 */
function displayGraphInfo(jason)
{
  /** TODO - Display graph info as it was done in previous commits */
  // console.log(jason);
  /** Display graph name */
  // document.getElementById("graphName").innerHTML = name;
  /* Display number of vertices */
  jason.graphInfo[0].vlayer !== undefined ? document.getElementById("numberOfVertices").innerHTML = parseInt(jason.graphInfo[0].vlayer.split(" ")[0]) + parseInt(jason.graphInfo[0].vlayer.split(" ")[1]) : document.getElementById("numberOfVertices").innerHTML = parseInt(jason.graphInfo[0].vertices.split(" ")[0]) + parseInt(jason.graphInfo[0].vertices.split(" ")[1]);
  /* Display number of edges */
  document.getElementById("numberOfEdges").innerHTML = parseInt(jason.graphInfo[0].edges);
  /* Display number of vertices in first set */
  jason.graphInfo[0].vlayer !== undefined ? document.getElementById("nVerticesFirstLayer").innerHTML = parseInt(jason.graphInfo[0].vlayer.split(" ")[0]) : document.getElementById("nVerticesFirstLayer").innerHTML = parseInt(jason.graphInfo[0].vertices.split(" ")[0])
  /* Display number of vertices in second set */
  jason.graphInfo[0].vlayer !== undefined ? document.getElementById("nVerticesSecondLayer").innerHTML = parseInt(jason.graphInfo[0].vlayer.split(" ")[1]) : document.getElementById("nVerticesSecondLayer").innerHTML = parseInt(jason.graphInfo[0].vertices.split(" ")[1])
}

function disposeNode (node)
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

function disposeHierarchy (node, callback)
{
    for (var i = node.children.length - 1; i >= 0; i--)
    {
        var child = node.children[i];
        disposeHierarchy (child, callback);
        callback (child);
    }
}

/**
 * Connect vertexes from previous level to current level, according to .cluster file.
 * @param {Array} clusters .cluster file grouped as an array.
 * @param {Object} scene Scene to get meshes.
 * @param {int} outerBPLevel Outer bipartite graph level (previous coarsening level). Necessary to access proper mesh where such bipartite graph was built.
 * @param {int} outerBPLevel Inner bipartite graph level. Necessary to access proper mesh where such bipartite graph was built.
 */
function connectLevels(clusters, scene, outerBPLevel, innerBPLevel)
{
  /** Read char by char, storing numbers in an array */
  var clusterVertexes = clusters.toString().split("\n");
  /** Get specific meshes for each coarsened level */
  var outerMesh;
  parseInt(outerBPLevel) == 0 ? outerMesh = scene.getObjectByName("MainMesh", true) : outerMesh = scene.getObjectByName("MainMesh" + outerBPLevel.toString(), true);
  var innerMesh;
  parseInt(innerBPLevel) == 0 ? innerMesh = scene.getObjectByName("MainMesh", true) : innerMesh = scene.getObjectByName("MainMesh" + innerBPLevel.toString(), true);
  /** Iterate through clusterVertexes array, constructing edges between layers */
  var edgeGeometry = new THREE.Geometry();
  for(let i = 0, k = 0; i < innerMesh.geometry.faces.length && k < clusterVertexes.length; i = i + 32, k = k + 1)
  {
    var v1 = new THREE.Vector3(innerMesh.geometry.faces[i].position.x, innerMesh.geometry.faces[i].position.y, innerMesh.geometry.faces[i].position.z);
    var previousVertexes = clusterVertexes[k].split(" ");
    for(let j = 0; j < previousVertexes.length && outerMesh.geometry.faces[parseInt(previousVertexes[j])*32] !== undefined; j++)
    {
      // console.log("outerMesh:");
      // console.log(outerMesh.geometry.faces.length);
      // console.log("innerMesh:");
      // console.log(innerMesh.geometry.faces.length);
      // console.log("parseInt(previousVertexes[j])*32");
      // console.log(outerMesh.geometry.faces[parseInt(previousVertexes[j])*32]);
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
  // console.log("Hi, I'm a newborn function yet to be implemented :3");
  // console.log("outerBPLevel:");
  // console.log(outerBPLevel);
  // console.log("outerMesh:");
  // console.log(outerMesh);
  // console.log("innerBPLevel:");
  // console.log(innerBPLevel);
  // console.log("innerMesh:");
  // console.log(innerMesh);
}

/**
 * Render a bipartite graph, given a .json file.
 * @public
 * @param {(string|Array)} data String of graph (or graphs) to be parsed into JSON notation and rendered.
 * @param {int} layout Graph layout. Default is 2 (bipartite horizontal).
 */
function build(data, layout, min, max)
{
  /** Check and treat incoming response */
  data = JSON.parse(data);
  graphName = data.graphName;
  numOfLevels = data.nLevels;
  firstSet = data.firstSet;
  secondSet = data.secondSet;
  data = data.graph;
  min = ecmaStandard(min, 10);
  max = ecmaStandard(max, 70);
  lay = ecmaStandard(layout, 2);
  /* Converting text string to JSON */
  var jason = JSON.parse(data);

  /* Display bipartite graph info */
  displayGraphInfo(jason);

  /* Instantiating Graph */
  if(bipartiteGraph !== undefined) delete bipartiteGraph;
  bipartiteGraph = new BipartiteGraph(jason, 8, "", min, max);
  // bipartiteGraph = new BipartiteGraph(jason, 10, 70);

  if(renderer == undefined)
  {
      /* Get the size of the inner window (content area) to create a full size renderer */
      canvasWidth = (document.getElementById("mainSection").clientWidth);
      canvasHeight = (document.getElementById("mainSection").clientHeight);
      /* Create a new WebGL renderer */
      renderer = new THREE.WebGLRenderer({antialias:true});
      /* Set the background color of the renderer to black, with full opacity */
      renderer.setClearColor("rgb(255, 255, 255)", 1);
      /* Set the renderers size to the content area size */
      renderer.setSize(canvasWidth, canvasHeight);
  }
  else
  {
      renderer.setRenderTarget(null);
      renderer.clear();
  }

  /* Create scene */
  if(scene !== undefined)
  {
    disposeHierarchy(scene, disposeNode);
    for(var i = scene.children.length - 1; i >= 0; i--)
    {
      scene.remove(scene.children[i]);
    }
    delete scene;
  }
  else
  {
    scene = new THREE.Scene();
  }

  /* Get the DIV element from the HTML document by its ID and append the renderers' DOM object to it */
  document.getElementById("WebGL").appendChild(renderer.domElement);

  /* Build bipartiteGraph */
  // bipartiteGraph.buildGraph(jason, scene, lay);
  /* Render bipartiteGraph */
  bipartiteGraph.renderGraph(jason, scene, lay);

  if(bipartiteGraphs !== undefined) bipartiteGraphs = [];
  var nLevels = 0;
  // for(var i = 0; i < parseInt(numOfLevels)-1; i = i + 1)
  /** Construct new bipartite graphs from previous levels of coarsening */
  for(let i = parseInt(numOfLevels)-1; i >= 0; i = i - 1)
  {
    var gName = graphName.split(".")[0];
    gName = gName.substring(0, gName.length-2);
    i == 0 ? gName = gName.substring(0, gName.lastIndexOf('Coarsened')) + ".json" : gName = gName + "n" + (i).toString() + ".json";
    $.ajax({
      async: false,
      url: '/getLevels',
      type: 'POST',
      data: gName,
      processData: false,
      contentType: false,
      success: function(data){
        /** Store JSON graph in array */
        // bipartiteGraphs.push(new BipartiteGraph(JSON.parse(JSON.parse(data).graph), bipartiteGraph.distanceBetweenSets - (i+1), (nLevels+1).toString()));
        bipartiteGraphs.push(JSON.parse(JSON.parse(data).graph));
        // bipartiteGraphs[bipartiteGraphs.length-1].renderNodes(JSON.parse(JSON.parse(data).graph), scene, lay, new IndependentSet(), new IndependentSet());
        // nLevels = nLevels + 1;
        // var coarsenedBipartiteGraph = new BipartiteGraph(JSON.parse(JSON.parse(data).graph), bipartiteGraph.distanceBetweenSets - (nLevels+2), (nLevels+1).toString());
        // /** Render independent sets in scene */
        // coarsenedBipartiteGraph.renderNodes(JSON.parse(JSON.parse(data).graph), scene, lay, new IndependentSet(), new IndependentSet());
        // /** Make connections with coarsened vertexes - use ajax call to get .cluster file, containing coarsened super vertexes */
        // $.ajax({
        //   url: '/getClusters',
        //   type: 'POST',
        //   data: gName + "n" + (i).toString() + ".cluster",
        //   processData: false,
        //   contentType: false,
        //   success: function(data){
        //     connectLevels(data, scene, parseInt(numOfLevels)-1, i-1);
        //   },
        //   xhr: loadGraph
        // });
      },
      xhr: loadGraph
    });
  }
  /** Sort array */
  bipartiteGraphs.sort(function(a, b){
    if(a.graphInfo[0].graphSize < b.graphInfo[0].graphSize) return -1;
    else if(a.graphInfo[0].graphSize > b.graphInfo[0].graphSize) return 1;
    else return 0;
  });
  console.log("bipartiteGraphs: ");
  console.log(bipartiteGraphs);
  /** Render previous uncoarsened graphs */
  for(let i = parseInt(numOfLevels)-1; i >= 0; i = i - 1)
  {
    var coarsenedBipartiteGraph = new BipartiteGraph(bipartiteGraphs[i], bipartiteGraph.distanceBetweenSets - (i+1), (nLevels+1).toString());
    coarsenedBipartiteGraph.renderNodes(bipartiteGraphs[i], scene, lay, new IndependentSet(), new IndependentSet());
    nLevels = nLevels + 1;
  }
  /** Fetch .cluster files and connect nodes based on such files */
  nLevels = parseInt(numOfLevels);
  for(let i = 0; i < parseInt(numOfLevels); i++)
  {
    console.log("nLevels: " + nLevels);
    var gName = graphName.split(".")[0];
    gName = gName.substring(0, gName.length-2);
    gName = gName + "n" + nLevels.toString() + ".cluster";
    nLevels = nLevels - 1;
    $.ajax({
      async: false,
      url: '/getClusters',
      type: 'POST',
      data: gName,
      processData: false,
      contentType: false,
      success: function(data){
        connectLevels(data, scene, i+1, i);
      },
      xhr: loadGraph
    });
  }

  /** Create edge gradient legend */
  if(gradientLegend !== undefined)
  {
      gradientLegend.clear();
      delete gradientLegend;
  }
  // gradientLegend = new GradientLegend(bipartiteGraph.linearScale, bipartiteGraph.graphInfo, bipartiteGraph.minEdgeWeight, bipartiteGraph.maxEdgeWeight, 300, 50);
  /** Use minimum edge weight and maximum edge weight as domain values */
  gradientLegend = new GradientLegend(bipartiteGraph.linearScale, bipartiteGraph.graphInfo.minEdgeWeight, bipartiteGraph.graphInfo.maxEdgeWeight, 300, 50, 5);
  gradientLegend.createGradientLegend("gradientScale", "Edge weights:");

  delete jason;

  /* Create the camera and associate it with the scene */
  if(camera !== undefined) delete camera;
  camera = new THREE.PerspectiveCamera(120, canvasWidth / canvasHeight, 1, 2000);
  camera.position.set(0, 0, cameraPos);
  camera.lookAt(scene.position);
  camera.name = "camera";
  scene.add(camera);

  /* Create simple directional light */
  if(light !== undefined) delete light;
  light = new THREE.DirectionalLight();
  light.position.set(0, 0, 10);
  scene.add(light);

  /* Using orbitControls for moving */
  if(controls !== undefined) delete controls;
  var controls = new THREE.OrbitControls(camera, renderer.domElement);

  /* Setting up params */
  controls.minDistance = 1;
  controls.maxDistance = 500;
  controls.zoomSpeed = 1.5;
  controls.target.set(0, 0, 0);
  controls.enableRotate = false;
  controls.enableKeys = false;

  controls.mouseButtons = { PAN: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, ORBIT: THREE.MOUSE.RIGHT };

  /** Creating event listener */
  if(eventHandler === undefined)
  {
    eventHandler = new EventHandler(undefined);
    /* Adding event listeners */
    document.addEventListener('resize', function(evt){
      camera.aspect = document.getElementById("WebGL").clientWidth / document.getElementById("WebGL").clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(document.getElementById("WebGL").clientWidth, document.getElementById("WebGL").clientHeight);
    }, false);
    document.addEventListener('mousemove', function(evt){eventHandler.mouseMoveEvent(evt, renderer, scene);}, false);
    document.addEventListener('dblclick', function(evt){
      eventHandler.mouseDoubleClickEvent();
      // eventHandler.mouseDoubleClickEvent(clicked, evt, bipartiteGraph);
      // !clicked ? clicked = true : clicked = false;
    }, false);
    document.addEventListener('click', function(evt){
      eventHandler.mouseClickEvent(evt, renderer, scene);
    }, false);
  }

  // console.log(renderer.info);
  animate();

  function animate()
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
