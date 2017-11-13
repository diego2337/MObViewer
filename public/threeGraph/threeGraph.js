function build(data)
{
  var scene, renderer;
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
