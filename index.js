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

var rotating = false;

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
        X_AXIS = new THREE.Vector3(1, 0, 0);
        Y_AXIS = new THREE.Vector3(0, 1, 0);
        Z_AXIS = new THREE.Vector3(0, 0, 1);

        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        scene = new THREE.Scene();
        pivot = new THREE.Object3D();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = 1000;

        // init camera controls
        controls = new THREE.TrackballControls(camera);
        controls.rotateSpeed = 5.0;
        controls.zoomSpeed = 1.0;
        controls.noZoom = false;
        controls.noPan = true;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.keys = [65, 83, 68];
        controls.addEventListener('change', render);

        // init cube piece geometry and colors
        geometry = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
        for (var i = 0; i < geometry.faces.length; i += 2) {
            geometry.faces[i].color.setHex(CUBE_COLORS[i / 2]);
            geometry.faces[i + 1].color.setHex(CUBE_COLORS[i / 2]);
        }
        material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            vertexColors: THREE.FaceColors
        });

        // create cube pieces
        for (var i = 0; i < 27; i++) {
            cubeMeshArray[i] = new THREE.Mesh(geometry, material);
            cubeMeshArray[i].position.x = (i * (SIZE + MARGIN)) % ((SIZE + MARGIN) * 3) - (SIZE + MARGIN);
            cubeMeshArray[i].position.y = (Math.floor((i % 9) / 3) * (SIZE + MARGIN)) - (SIZE + MARGIN);
            cubeMeshArray[i].position.z = Math.floor(i / 9) * (SIZE + MARGIN) - (SIZE + MARGIN);
            cubeMeshArray[i].callback = function() {
                console.log('click piece');
            }
            scene.add(cubeMeshArray[i]);
        }

        scene.add(pivot);

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);

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

        document.body.appendChild(renderer.domElement);
        animate();
        render();
    }, 500);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

function render() {
    TWEEN.update();
    renderer.render(scene, camera);
}

// source: http://stackoverflow.com/questions/12800150/catch-the-click-event-on-a-specific-mesh-in-the-renderer
function onDocumentMouseDown(e) {
    e.preventDefault();

    mouse.x = (e.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.clientY / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(cubeMeshArray);

    if (intersects.length > 0) {
        // intersects[0].object.callback();
        // console.log(intersects[0].object);
    }
}

// ***---*** ROTATION ***---*** //

function getGroup(toRotate) {
    var group = new THREE.Object3D();
    for (var i = 0; i < toRotate.length; i++) {
        scene.remove(toRotate[i]);
        group.add(toRotate[i]);
    }
    scene.add(group);
    return group;
}

function rotateCallback(toRotate, group) {
    scene.updateMatrixWorld();
    for (var i = 0; i < toRotate.length; i++) {
        toRotate[i].applyMatrix(group.matrixWorld);
        group.remove(toRotate[i]);
        scene.add(toRotate[i]);
    }

    rotating = false;
}

function getRotation(doPrime) {
    return doPrime ? -Math.PI / 2 : Math.PI / 2;
}

function getCubes(face) {
    switch (face) {
    case 0:
        return cubeMeshArray.filter(function(obj, i) {
            return SIZE <= obj.position.z && obj.position.z < SIZE + 2 * MARGIN;
        });
    case 1:
        return cubeMeshArray.filter(function(obj, i) {
            return -(SIZE + 2 * MARGIN) <= obj.position.z && obj.position.z < -SIZE;
        });
    case 2:
        return cubeMeshArray.filter(function(obj, i) {
            return -(SIZE + 2 * MARGIN) <= obj.position.x && obj.position.x < -SIZE;
        });
    case 3:
        return cubeMeshArray.filter(function(obj, i) {
            return SIZE <= obj.position.x && obj.position.x < SIZE + 2 * MARGIN;
        });
    case 4:
        return cubeMeshArray.filter(function(obj, i) {
            return SIZE <= obj.position.x && obj.position.x < SIZE + 2 * MARGIN;
        });
    case 5:
        return cubeMeshArray.filter(function(obj, i) {
            return SIZE <= obj.position.y && obj.position.y < SIZE + 2 * MARGIN;
        });
    case 6:
        return cubeMeshArray.filter(function(obj, i) {
            return -(SIZE + 2 * MARGIN) <= obj.position.y && obj.position.y < -SIZE;
        });
    }
}

// do* functions perform cube instructions
// @param doPrime  performs instruction CCW if true
function doF(doPrime = false) {
    if (rotating) return;
    rotating = true;

    var toRotate = getCubes(0);
    var group = getGroup(toRotate);
    rotateAroundWorldAxis(group, Z_AXIS, getRotation(doPrime), function() {
        rotateCallback(toRotate, group);
    });
}

function doB(doPrime = false) {
    if (rotating) return;
    rotating = true;

    var toRotate = getCubes(1);
    var group = getGroup(toRotate);
    rotateAroundWorldAxis(group, Z_AXIS, getRotation(doPrime), function() {
        rotateCallback(toRotate, group);
    });
}

function doL(doPrime = false) {
    if (rotating) return;
    rotating = true;

    var toRotate = getCubes(2);
    var group = getGroup(toRotate);
    rotateAroundWorldAxis(group, X_AXIS, getRotation(doPrime), function() {
        rotateCallback(toRotate, group);
    });
}

function doR(doPrime = false) {
    if (rotating) return;
    rotating = true;

    var toRotate = getCubes(3);
    var group = getGroup(toRotate);
    rotateAroundWorldAxis(group, X_AXIS, getRotation(doPrime), function() {
        rotateCallback(toRotate, group);
    });
}

function doU(doPrime = false) {
    if (rotating) return;
    rotating = true;

    var toRotate = getCubes(5);
    var group = getGroup(toRotate);
    rotateAroundWorldAxis(group, Y_AXIS, getRotation(doPrime), function() {
        rotateCallback(toRotate, group);
    });
}

function doD(doPrime = false) {
    if (rotating) return;
    rotating = true;

    var toRotate = getCubes(6);
    var group = getGroup(toRotate);
    rotateAroundWorldAxis(group, Y_AXIS, getRotation(doPrime), function() {
        rotateCallback(toRotate, group);
    });
}

// Rotate an object around an arbitrary axis in world space
function rotateAroundWorldAxis(object, axis, radians, callback) {
    var rot;
    if (axis === Z_AXIS) {
        rot = { z: radians }
    } else if (axis === X_AXIS) {
        rot = { x: radians }
    } else {
        rot = { y: radians }
    }

    var t = new TWEEN.Tween(object.rotation)
        .to(rot, 50)
        .onUpdate(function() {
            if (axis === Z_AXIS) {
                object.rotation.z = this.z;
            } else if (axis === X_AXIS) {
                object.rotation.x = this.x;
            } else {
                object.rotation.y = this.y;
            }
        })
        .onComplete(callback)
        .start();
}
