/* Creating event listener */
var eventHandler = new EventHandler();

/* Creating renderer */
var renderer = new THREE.WebGLRenderer({antialias:true});

/* Set the background color of the renderer to black, with full opacity */
renderer.setClearColor("rgb(255, 255, 255)", 1);

/* Get the size of the inner window (content area) to create a full size renderer */
canvasWidth = window.innerWidth;
canvasHeight = window.innerHeight;

/* Set the renderers size to the content areas size */
renderer.setSize(canvasWidth, canvasHeight);

/* Get the DIV element from the HTML document by its ID and append the renderers DOM object to it */
document.getElementById("WebGL").appendChild(renderer.domElement);


/* Create the camera and associate it with the scene */
camera = new THREE.PerspectiveCamera(120, canvasWidth / canvasHeight, 1, 500);
/* Setting Z value so that every element will have the same depth */
// Depth.setZ(10);
camera.position.set(0, 0, 10);
camera.lookAt(scene.position);
camera.name = "camera";
scene.add(camera);

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
