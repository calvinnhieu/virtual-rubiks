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
var scene, camera, renderer, pivot;
var geometry, material;
var cubeMeshArray = new Array();
var controls;

var raycaster, mouse;

var SIZE = 100;
var MARGIN = 5;

var RED = 0xf44336;
var ORANGE = 0xff9800;
var WHITE = 0xffffff;
var YELLOW = 0xffeb3b;
var GREEN = 0x4cAf50;
var BLUE = 0x2196f3;

var CUBE_COLORS = [RED, ORANGE, WHITE, YELLOW, GREEN, BLUE];
// TODO: replace with mouse drag events
var keyToTurnMap = {
  70: function(shiftKeyDown) { doF(shiftKeyDown) }, // f
  66: function(shiftKeyDown) { doB(shiftKeyDown) }, // b
  76: function(shiftKeyDown) { doL(shiftKeyDown) }, // l
  82: function(shiftKeyDown) { doR(shiftKeyDown) }, // r
  85: function(shiftKeyDown) { doU(shiftKeyDown) }, // u
  68: function(shiftKeyDown) { doD(shiftKeyDown) }, // f
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
    pivot = new THREE.Object3D();

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
      cubeMeshArray[i].position.x = (i * (SIZE+MARGIN)) % ((SIZE+MARGIN)*3) - (SIZE+MARGIN);
      cubeMeshArray[i].position.y = (Math.floor((i%9)/3) * (SIZE+MARGIN)) - (SIZE+MARGIN);
      cubeMeshArray[i].position.z = Math.floor(i/9) * (SIZE+MARGIN) - (SIZE+MARGIN);
      cubeMeshArray[i].callback = function() { console.log('click piece'); }
      scene.add( cubeMeshArray[i] );
    }
    scene.add(pivot);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    // init test event listeners
    document.addEventListener('keydown', function(e) {
      var action = keyToTurnMap[e.keyCode];

      if (action) {
        action(e.shiftKey);
      } else if (e.keyCode === 72) {
        var el = document.getElementsByClassName('legend')[0];

        el.style.opacity = el.style.opacity == 0 ? 1 : 0;
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
  var toRotate = cubeMeshArray.filter(function(obj, i) {
    return SIZE <= obj.position.z && obj.position.z < SIZE + 2*MARGIN;
  });

  startRotation(toRotate);
  rotateAroundWorldAxis(pivot, Z_AXIS, doPrime ? Math.PI / 2 : Math.PI * 3/2);
  render();
  endRotation(toRotate);
}
function doB(doPrime = false) {
  var toRotate = cubeMeshArray.filter(function(obj, i) {
    return -(SIZE + 2*MARGIN) <= obj.position.z && obj.position.z <  -SIZE;
  });

  startRotation(toRotate);
  rotateAroundWorldAxis(pivot, Z_AXIS, doPrime ? Math.PI * 3/2 : Math.PI / 2);
  render();
  endRotation(toRotate);
}
function doL(doPrime = false) {
  var toRotate = cubeMeshArray.filter(function(obj, i) {
    return -(SIZE + 2*MARGIN) <= obj.position.x && obj.position.x <  -SIZE;
  });

  startRotation(toRotate);
  rotateAroundWorldAxis(pivot, X_AXIS, doPrime ? Math.PI * 3/2  : Math.PI / 2);
  render();
  endRotation(toRotate);
}
function doR(doPrime = false) {
  var toRotate = cubeMeshArray.filter(function(obj, i) {
    return SIZE <= obj.position.x && obj.position.x < SIZE + 2*MARGIN;
  });

  startRotation(toRotate);
  rotateAroundWorldAxis(pivot, X_AXIS, doPrime ? Math.PI / 2  : Math.PI * 3/2);
  render();
  endRotation(toRotate);
}
function doU(doPrime = false) {
  var toRotate = cubeMeshArray.filter(function(obj, i) {
    return SIZE <= obj.position.y && obj.position.y < SIZE + 2*MARGIN;
  });

  startRotation(toRotate);
  rotateAroundWorldAxis(pivot, Y_AXIS, doPrime ? Math.PI / 2 : Math.PI * 3/2);
  render();
  endRotation(toRotate);
}
function doD(doPrime = false) {
  var toRotate = cubeMeshArray.filter(function(obj, i) {
    return -(SIZE + 2*MARGIN) <= obj.position.y && obj.position.y <  -SIZE;
  });

  startRotation(toRotate);
  rotateAroundWorldAxis(pivot, Y_AXIS, doPrime ? Math.PI * 3/2 : Math.PI / 2);
  render();
  endRotation(toRotate);
}

function startRotation(toRotate) {
  pivot.rotation.set(0,0,0);
  pivot.updateMatrixWorld();
  for (i in toRotate) {
    THREE.SceneUtils.attach(toRotate[i], scene, pivot);
  }
}
function endRotation(rotated) {
  pivot.updateMatrixWorld();
  for (i in rotated) {
    rotated[i].updateMatrixWorld();
    THREE.SceneUtils.detach(rotated[i], pivot, scene);
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
