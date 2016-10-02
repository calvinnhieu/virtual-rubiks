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
var currentMoveElement;
var canvas;

var config = {
  angle: 0.01,
  tiltAngle: 0.1,
  draw: draw,
  updatePosition: updatePosition,
  updateState: updateState
};
function draw(confetti) {
  canvas.context.beginPath();
  canvas.context.lineWidth = confetti.r / 2;
  canvas.context.strokeStyle = confetti.color;
  canvas.context.moveTo(confetti.x + confetti.tilt + (confetti.r / 4),
    confetti.y);
  canvas.context.lineTo(confetti.x + confetti.tilt, confetti.y +
    confetti.tilt + (confetti.r / 4));
  canvas.context.stroke();
}
function updatePosition(confetti, idx) {
  confetti.tiltAngle += confetti.tiltAngleIncrement;
  confetti.y += (Math.cos(config.angle + confetti.d) + 1 + confetti.r / 2) / 2;
  confetti.x += Math.sin(config.angle);
  confetti.tilt = 15 * Math.sin(confetti.tiltAngle - idx / 3);

  if (confetti.isFlakeExiting(canvas)) {
    if (idx % 5 > 0 || idx % 2 === 0) {
      confetti.x = Confetti.randomFrom(0, canvas.width);
      confetti.y = -10;
      confetti.tilt = Confetti.randomFrom(-10, 0);

    } else {
      if (Math.sin(config.angle) > 0) {
        confetti.x = -5;
        confetti.y = Confetti.randomFrom(0, canvas.height);
        confetti.tilt = Confetti.randomFrom(-10, 0);
      } else {
        confetti.x = canvas.width + 5;
        confetti.y = Confetti.randomFrom(0, canvas.height);
        confetti.tilt = Confetti.randomFrom(-10, 0);
      }
    }
  }
}
function updateState() {
  this.angle += 0.01;
  this.tiltAngle += 0.1;
}

var Modes = {
    FREE: 0,
    SOLVING: 1
}
var mode = Modes.FREE;

var scene, camera, renderer, pivot;
var geometry, material;
var cubeMeshArray = new Array();
var controls;

var raycaster, mouse;

var currentMove;
var moves;

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
var freeKeyToTurnMap = {
    70: function(shiftKeyDown) { doF(shiftKeyDown) }, // f
    66: function(shiftKeyDown) { doB(shiftKeyDown) }, // b
    76: function(shiftKeyDown) { doL(shiftKeyDown) }, // l
    82: function(shiftKeyDown) { doR(shiftKeyDown) }, // r
    85: function(shiftKeyDown) { doU(shiftKeyDown) }, // u
    68: function(shiftKeyDown) { doD(shiftKeyDown) }, // f

    49: function(shiftKeyDown) { doF(shiftKeyDown) }, // 1
    50: function(shiftKeyDown) { doB(shiftKeyDown) }, // 2
    51: function(shiftKeyDown) { doL(shiftKeyDown) }, // 3
    52: function(shiftKeyDown) { doR(shiftKeyDown) }, // 4
    53: function(shiftKeyDown) { doU(shiftKeyDown) }, // 5
    54: function(shiftKeyDown) { doD(shiftKeyDown) }, // 6
}

var solvingKeyMap = {
    39: nextMove        // right
}

var X_AXIS;
var Y_AXIS;
var Z_AXIS;

init();

function init() {
    // waits for three.js to load
    setTimeout(function() {
        canvas = Confetti.createCanvas(document.getElementById("confettiContainer"),
                                       document.getElementById("confetti"));

        currentMoveElement = document.getElementById("current_move");

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
            var keyMap = mode === Modes.FREE ? freeKeyToTurnMap : solvingKeyMap;
            var action = keyMap[e.keyCode];

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

        document.body.appendChild(renderer.domElement);
        animate();
        render();

        doMoves("D2 B' R' B L' B")
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

// ***---*** STRING OF MOVES ***---*** //

var MOVES = {
    "U": doU,  "U2": function() { doU(doU); },  "U'": function() { doU(true) },
    "F": doF,  "F2": function() { doF(doF); },  "F'": function() { doF(true) },
    "D": doD,  "D2": function() { doD(doD); },  "D'": function() { doD(true) },
    "B": doB,  "B2": function() { doB(doB); },  "B'": function() { doB(true) },
    "L": doL,  "L2": function() { doL(doL); },  "L'": function() { doL(true) },
    "R": doR,  "R2": function() { doR(doR); },  "R'": function() { doR(true) },
};

function doMoves(string) {
    if (string !== "") {
        mode = Modes.SOLVING;
        currentMove = 0;
        moves = string.split(" ");
        console.log("Solving: " + string);
    }
}

function nextMove() {
    if (rotating) return;
    if (currentMove >= moves.length) {
        console.log("Done");
        currentMoveElement.innerHTML = "Solved!";
        mode = Modes.FREE;

        var particles = _.range(0, Confetti.DEFAULT_NUM).map(function () {
          return Confetti.create({
            x: Confetti.randomFrom(0, canvas.width),
            y: 0,
            r: Confetti.randomFrom(5, 30),
            tilt: Confetti.randomFrom(-10, 0),
            tiltAngle: 0,
            tiltAngleIncrement: Confetti.randomFrom(0.05, 0.12, 100)
          });
        });
        canvas.step(particles, config)();

        return;
    }

    console.log("Showing move: " + moves[currentMove]);
    currentMoveElement.innerHTML = moves[currentMove];
    MOVES[moves[currentMove]]();
    currentMove++;
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
    return doPrime ? Math.PI / 2 : -Math.PI / 2;
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
function doF(doPrime, callback) {
    if (rotating) return;
    rotating = true;

    if (typeof doPrime === 'function') {
        callback = doPrime;
        doPrime = false;
    } else {
        if (typeof doPrime === 'undefined' || doPrime === null) {
            doPrime = false;
        } else {
            doPrime = doPrime || false;
        }

        callback = callback || function() {};
    }

    var toRotate = getCubes(0);
    var group = getGroup(toRotate);
    rotateAroundWorldAxis(group, Z_AXIS, getRotation(doPrime), function() {
        rotateCallback(toRotate, group);
        callback();
    });
}

function doB(doPrime, callback) {
    if (rotating) return;
    rotating = true;

    if (typeof doPrime === 'function') {
        callback = doPrime;
        doPrime = false;
    } else {
        if (typeof doPrime === 'undefined' || doPrime === null) {
            doPrime = false;
        } else {
            doPrime = doPrime || false;
        }

        callback = callback || function() {};
    }

    var toRotate = getCubes(1);
    var group = getGroup(toRotate);
    rotateAroundWorldAxis(group, Z_AXIS, -getRotation(doPrime), function() {
        rotateCallback(toRotate, group);
        callback();
    });
}

function doL(doPrime, callback) {
    if (rotating) return;
    rotating = true;

    if (typeof doPrime === 'function') {
        callback = doPrime;
        doPrime = false;
    } else {
        if (typeof doPrime === 'undefined' || doPrime === null) {
            doPrime = false;
        } else {
            doPrime = doPrime || false;
        }

        callback = callback || function() {};
    }

    var toRotate = getCubes(2);
    var group = getGroup(toRotate);
    rotateAroundWorldAxis(group, X_AXIS, -getRotation(doPrime), function() {
        rotateCallback(toRotate, group);
        callback();
    });
}

function doR(doPrime, callback) {
    if (rotating) return;
    rotating = true;

    if (typeof doPrime === 'function') {
        callback = doPrime;
        doPrime = false;
    } else {
        if (typeof doPrime === 'undefined' || doPrime === null) {
            doPrime = false;
        } else {
            doPrime = doPrime || false;
        }

        callback = callback || function() {};
    }

    var toRotate = getCubes(3);
    var group = getGroup(toRotate);
    rotateAroundWorldAxis(group, X_AXIS, getRotation(doPrime), function() {
        rotateCallback(toRotate, group);
        callback();
    });
}

function doU(doPrime, callback) {
    if (rotating) return;
    rotating = true;

    if (typeof doPrime === 'function') {
        callback = doPrime;
        doPrime = false;
    } else {
        if (typeof doPrime === 'undefined' || doPrime === null) {
            doPrime = false;
        } else {
            doPrime = doPrime || false;
        }

        callback = callback || function() {};
    }

    var toRotate = getCubes(5);
    var group = getGroup(toRotate);
    rotateAroundWorldAxis(group, Y_AXIS, getRotation(doPrime), function() {
        rotateCallback(toRotate, group);
        callback();
    });
}

function doD(doPrime, callback) {
    if (rotating) return;
    rotating = true;

    if (typeof doPrime === 'function') {
        callback = doPrime;
        doPrime = false;
    } else {
        if (typeof doPrime === 'undefined' || doPrime === null) {
            doPrime = false;
        } else {
            doPrime = doPrime || false;
        }

        callback = callback || function() {};
    }

    var toRotate = getCubes(6);
    var group = getGroup(toRotate);
    rotateAroundWorldAxis(group, Y_AXIS, -getRotation(doPrime), function() {
        rotateCallback(toRotate, group);
        callback();
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
        .to(rot, 500)
        .easing(TWEEN.Easing.Elastic.Out)
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
