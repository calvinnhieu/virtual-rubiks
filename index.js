/*
 * -- Virtual Rubik's Cube --
 * This project creates an interactive Rubik's Cube
 * in the browser built using three.js.
 *
 * Controls:
 * Drag to scan.
 * Scroll to zoom.
 * Numpad 1-6 to perform CW rotations.
 * Hold shift to perform CCW rotations.
 *
 */
var scene, camera, renderer;
var geometry, material;
var cubeMeshArray = new Array();
var controls;

var raycaster, mouse;

var SIZE = 100;
var MARGIN = 5;

var RED = 0xf44336;
var GREEN = 0x4cAf50;
var BLUE = 0x2196f3;
var ORANGE = 0xff9800;
var YELLOW = 0xffeb3b;
var WHITE = 0xffffff;

var CUBE_COLORS = [RED, GREEN, BLUE, ORANGE, YELLOW, WHITE];
// TODO: replace with mouse drag events
var keyToTurnMap = {
  49: function(shiftKeyDown) { doF(shiftKeyDown) }, // 1
  50: function(shiftKeyDown) { doB(shiftKeyDown) }, // 2
  51: function(shiftKeyDown) { doL(shiftKeyDown) }, // 3
  52: function(shiftKeyDown) { doR(shiftKeyDown) }, // 4
  53: function(shiftKeyDown) { doU(shiftKeyDown) }, // 5
  54: function(shiftKeyDown) { doD(shiftKeyDown) }, // 6
}

var X_AXIS;
var Y_AXIS;
var Z_AXIS;

init();

function init() {
  // waits for three.js to load
  setTimeout(function() {
    X_AXIS = new THREE.Vector3(1,0,0);
    Y_AXIS = new THREE.Vector3(0,1,0);
    Z_AXIS = new THREE.Vector3(0,0,1);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 1000;

    // init camera controls
    controls = new THREE.TrackballControls(camera);
    controls.rotateSpeed = 5.0;
		controls.zoomSpeed = 1.0;
		controls.noZoom = false;
		controls.noPan = true;
		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;
		controls.keys = [ 65, 83, 68 ];
		controls.addEventListener( 'change', render );

    // init cube piece geometry and colors
    geometry = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
    for ( var i = 0; i < geometry.faces.length; i+=2  ) {
      geometry.faces[ i ].color.setHex(CUBE_COLORS[i/2]);
      geometry.faces[ i+1 ].color.setHex(CUBE_COLORS[i/2]);
    }
    material = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );

    // create cube pieces
    for (var i = 0; i < 27; i++) {
      cubeMeshArray[i] = new THREE.Mesh( geometry, material );
      cubeMeshArray[i].position.x = (i * (SIZE+MARGIN)) % ((SIZE+MARGIN)*3) - SIZE*3/2;
      cubeMeshArray[i].position.y = (Math.floor((i%9)/3) * (SIZE+MARGIN)) - SIZE*3/2;
      cubeMeshArray[i].position.z = Math.floor(i/9) * (SIZE+MARGIN) - SIZE*3/2;
      cubeMeshArray[i].callback = function() { console.log('click piece'); }
      scene.add( cubeMeshArray[i] );
    }

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    // init test event listeners
    document.addEventListener('keydown', function(e) {
      var action = keyToTurnMap[e.keyCode];

      if (action) {
        action(e.shiftKey);
      }
    });
    document.addEventListener('mousedown', function(e) {
      onDocumentMouseDown(e);
    });

    document.body.appendChild( renderer.domElement );
    animate();
    render();
  }, 500);
}

function animate() {
  requestAnimationFrame( animate );
  controls.update();
}

function render() {
  renderer.render(scene, camera);
}

// source: http://stackoverflow.com/questions/12800150/catch-the-click-event-on-a-specific-mesh-in-the-renderer
function onDocumentMouseDown(e) {
  e.preventDefault();

  mouse.x = ( e.clientX / renderer.domElement.clientWidth ) * 2 - 1;
  mouse.y = - ( e.clientY / renderer.domElement.clientHeight ) * 2 + 1;

  raycaster.setFromCamera( mouse, camera );

  var intersects = raycaster.intersectObjects(cubeMeshArray);

  if (intersects.length > 0) {
      // intersects[0].object.callback();
      // console.log(intersects[0].object);
  }
}

// do* functions perform cube instructions
// @param doPrime  performs instruction CCW if true
function doF(doPrime = false) {
  for (var i = 18; i < 27; i++) {
    rotateAroundWorldAxis(cubeMeshArray[i], Z_AXIS, doPrime ? Math.PI / 2 : Math.PI * 3/2);
    render();
  }
}
function doB(doPrime = false) {
  for (var i = 0; i < 9; i++) {
    rotateAroundWorldAxis(cubeMeshArray[i], Z_AXIS, doPrime ? Math.PI * 3/2 : Math.PI / 2);
    render();
  }
}
function doL(doPrime = false) {
  for (var i = 0; i < cubeMeshArray.length; i++) {
    if (i%3 === 0) {
      rotateAroundWorldAxis(cubeMeshArray[i], X_AXIS, doPrime ? Math.PI * 3/2  : Math.PI / 2);
      render();
    }
  }
}
function doR(doPrime = false) {
  for (var i = 0; i < cubeMeshArray.length; i++) {
    if ((i-2) % 3 === 0) {
      rotateAroundWorldAxis(cubeMeshArray[i], X_AXIS, doPrime ? Math.PI / 2  : Math.PI * 3/2);
      render();
    }
  }
}
function doU(doPrime = false) {
  for (var i = 0; i < cubeMeshArray.length; i++) {
    if (Math.floor((i%9)/3) === 2) {
      rotateAroundWorldAxis(cubeMeshArray[i], Y_AXIS, doPrime ? Math.PI / 2 : Math.PI * 3/2);
      render();
    }
  }
}
function doD(doPrime = false) {
  for (var i = 0; i < cubeMeshArray.length; i++) {
    if (Math.floor((i%9)/3) === 0) {
      rotateAroundWorldAxis(cubeMeshArray[i], Y_AXIS, doPrime ? Math.PI * 3/2 : Math.PI / 2);
      render();
    }
  }
}

// This function rotates mesh objects about the world axis
// source: http://stackoverflow.com/questions/11060734/how-to-rotate-a-3d-object-on-axis-three-js
var rotWorldMatrix;
// Rotate an object around an arbitrary axis in world space
function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiply(object.matrix); // pre-multiply
    object.matrix = rotWorldMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
}
