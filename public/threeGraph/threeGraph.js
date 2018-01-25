/* Global variables */
var renderer;
var graph;
var scene;
var camera;
var light;
var controls;
var eventHandler;
var layout = 2;
var capture = false;
var clicked = false;

/* Check to see if any node is highlighted, and highlight its corresponding edges */
// $('#WebGL').on('mousemove', function(){
//   console.log("Ta vindo aqui?");
//   if(eventHandler !== undefined)
//   {
//     var highlightedElements = eventHandler.getHighlightedElements();
//     if(graph !== undefined)
//     {
//         graph.highlightEdges(highlightedElements);
//     }
//   }
// });

/**
 * Display graph info to HTML page
 * param:
 *    - jason: .json file representing graph
 */
function displayGraphInfo(jason)
{
  // console.log(jason);
  /* Display number of vertices */
  document.getElementById("numberOfVertices").innerHTML = parseInt(jason.graphInfo[0].vlayer.split(" ")[0]) + parseInt(jason.graphInfo[0].vlayer.split(" ")[1]);
  /* Display number of edges */
  document.getElementById("numberOfEdges").innerHTML = parseInt(jason.graphInfo[0].edges);
  /* Display number of vertices in first set */
  document.getElementById("firstSet").innerHTML = parseInt(jason.graphInfo[0].vlayer.split(" ")[0]);
  /* Display number of vertices in second set */
  document.getElementById("secondSet").innerHTML = parseInt(jason.graphInfo[0].vlayer.split(" ")[1]);
}

/**
  * Render a bipartite graph given a .json file
  * param:
  *    - data: string graph to be parsed into JSON notation and rendered;
  *    - layout: graph layout. Default is 2 (bipartite horizontal)
  */
function build(data, layout)
{
  lay = ecmaStandard(layout, 2);
  /* Converting text string to JSON */
  var jason = JSON.parse(data);

  /* Display graph info */
  displayGraphInfo(jason);

  /* Instantiating Graph */
  if(graph !== undefined) delete graph;
  graph = new Graph(jason, 10, 70);

  if(renderer == undefined)
  {
      /* Get the size of the inner window (content area) to create a full size renderer */
      // canvasWidth = (window.innerWidth) / 1.5;
      // canvasHeight = (window.innerHeight) / 1.5;
      canvasWidth = (document.getElementById("WebGL").clientWidth);
      canvasHeight = (document.getElementById("WebGL").clientHeight) - 20;

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
  if(scene !== undefined) delete scene;
  scene = new THREE.Scene();

  /* Build graph */
  graph.buildGraph(scene, lay);

  /* Define depth variable to set camera positioning */
  var depth = new Depth(0);
  depth.setZ(Math.abs(graph.getMinNode()) + Math.abs(graph.getMaxNode()));
  /* Create the camera and associate it with the scene */
  if(camera !== undefined) delete camera;
  camera = new THREE.PerspectiveCamera(120, canvasWidth / canvasHeight, 1, 2000);
  /* TODO - Setting Z value so that every element will have the same depth */
  //  setZ(10);
  camera.position.set(0, 0, 70);
  // camera.position.set(0, 0, (depth.getZ()));
  // console.log("(depth.getZ()): ", (depth.getZ()));
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

  /* Creating event listener */
  if(eventHandler !== undefined) delete eventHandler;
  eventHandler = new EventHandler(undefined, scene);

  // eventHandler.setScene(scene);

  /* Adding event listeners */
  document.addEventListener('mousemove', function(evt){eventHandler.mouseMoveEvent(evt, renderer, graph);}, false);
  document.addEventListener('dblclick', function(evt){
    eventHandler.mouseDoubleClickEvent(clicked, evt, graph);
    if(!clicked) clicked = true;
    else if(clicked) clicked = false;
  }, false);

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
