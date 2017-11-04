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
