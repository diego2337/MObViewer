var Edge = require('./src/edge.js');
var EventHandler = require('./utils/eventHandler.js');
var Graph = require('./src/graph.js');
var Node = require('./src/node.js');
var Tracker = require('./utils/tracker.js');

module.exports = {
  main : function(data)
  {
    var scene, renderer;

    /* Converting passed textarea input to JSON */
    // var jason = JSON.parse($.trim($("textarea").val()));
    
    /* Converting text string to JSON */
    var jason = JSON.parse(data);

    /* Instantiating Graph */
    var graph = new Graph(jason, 2, 10, 70);
    // console.log(graph);

    /* Creating event listener */
    var eventHandler = new EventHandler();

    /* Checking for WebGL compatibility */
    if(Detector.webgl)
    {
        console.log("WebGL supported");
        renderer = new THREE.WebGLRenderer({antialias:true});

        // If its not supported, instantiate the canvas renderer to support all non WebGL
        // browsers
    }
    else
    {
        console.log("WebGL not supported");
        renderer = new THREE.CanvasRenderer();
    }

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
    // Depth.setZ(10);
    camera.position.set(0, 0, 10);
    camera.lookAt(scene.position);
    camera.name = "camera";
    scene.add(camera);

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

    graph.buildGraph(scene);

    /* Tell the browser to call this function when page is visible */
    // requestAnimationFrame(animateScene);

    eventHandler.setScene(scene);

    /* Adding event listeners */
    document.addEventListener('click', function(evt){eventHandler.clickEvent(evt, renderer, graph);}, false);
    document.addEventListener('mousemove', function(evt){eventHandler.mouseMoveEvent(evt, renderer, graph);}, false);

    animate();

    function animate()
    {
        requestAnimationFrame(animate);
        /* Render scene */
        renderer.render(scene, camera);
    }
  }
}