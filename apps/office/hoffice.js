// import * as THREE from './node_modules/three/build/three.module.js';
import '../../web_modules/three/build/three.min.js';

import { PointerLockControls } from '../../web_modules/three/examples/jsm/controls/PointerLockControls.js';
import { GamepadControls } from '../../controls/GamepadControls.js';
import { addCrossHair } from '../../controls/CrossHair.js';
import * as OBJS from '../../gfx/Objects.js';

var camera, controls, gpControls, scene, renderer;

var dirLight;

var clock = new THREE.Clock();

var skyMesh;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();

const playerCamHeight = 125;
var absMaxDistance = 110;

var progressBarDiv;

var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );

init();

function init() {
    initScene();
    initControls();
}

function initControls() {

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );

    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;
    // renderer.physicallyCorrectLights = true;

    renderer.domElement.setAttribute('style', "position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; margin: auto");
    document.body.insertBefore( renderer.domElement, document.getElementById( 'blocker' ));

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 12000 );

    camera.up = new THREE.Vector3(0, 1, 0);
    camera.position.set(0, playerCamHeight, -150);
    camera.lookAt(new THREE.Vector3(0, playerCamHeight, 0));
    addCrossHair(camera);

    controls = new PointerLockControls( camera, document.body );
    gpControls = new GamepadControls( controls.getObject() );

    scene.add( controls.getObject() );

    let isTouch = ('ontouchstart' in window);

    instructions.addEventListener( 'touch', function () {

        controls.lock();

    }, false );

    instructions.addEventListener( 'click', function () {

        controls.lock();

    }, false );

    controls.addEventListener( 'lock', function () {

        updateBlocker(true);

        clock.start();

        requestAnimationFrame( animate );

    } );

    controls.addEventListener( 'unlock', function () {

        updateBlocker(false);

        clock.stop();
    } );

    var onKeyDown = function ( event ) {

        switch ( event.keyCode ) {

            case 38: // up
            case 87: // w
                moveForward = true;
                break;

            case 37: // left
            case 65: // a
                moveLeft = true;
                break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                break;

            case 32: // space
                if ( canJump === true ) velocity.y += 350;
                canJump = false;
                break;


            case 8: // back
                if (clock.running) {
                    clock.stop();
                } else {
                    clock.start();
                }
                break;
        }

    };

    var onKeyUp = function ( event ) {

        switch ( event.keyCode ) {

            case 27: //ESC
                controls.unlock();
                break;
            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;

        }

    };

    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

    window.addEventListener( 'resize', onWindowResize, false );
}

function updateBlocker(hide) {
    if (hide) {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    } else {
        blocker.style.display = 'block';
        instructions.style.display = '';
    }
}


function initScene() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x606060 );

    scene.fog = new THREE.Fog(0xcccccc, 2000, 12000);// .FogExp2( 0xcccccc, 0.0003);

    // world
    //var geometry = new THREE.PlaneGeometry( 200, 200 );
    //geometry.rotateX(Math.PI / 2);

    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0xB97A20;  // brownish orange
    const intensity = 0.8; // 0.8;
    var light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);

    var loader = new THREE.TextureLoader();
    loader.load('../../gfx/textures/sky_day.jpg',
        //loader.load('./gfx/nightsky.jpg',
        texture => {
            var skyGeo = new THREE.SphereBufferGeometry(12 * 640, 160, 160); //, 0, 2*Math.PI, 0, Math.PI/2);
            var skyMat = new THREE.MeshLambertMaterial({ map: texture, flatShading: true, emissive: 0x8888ff, emissiveIntensity: 0 }); //1
            // var skyMat = new THREE.MeshLambertMaterial({ map: texture, shading: THREE.FlatShading, emissive: 0x00 });
            skyMat.side = THREE.BackSide;
            skyMesh = new THREE.Mesh(skyGeo, skyMat);

            scene.add(skyMesh);
        }, xhr => {
            console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        }, error => { console.log("An error happened" + error); });

    showProgressBar();

    OBJS.loadModel('office', function ( newModel ) {
        newModel.rotateX(Math.PI);
        scene.add(newModel);

        hideProgressBar();
        updateControls(0);
        render();
        updateBlocker(false);

    }, onProgress, onError );

    // lights
    addSun();

    let plight = new THREE.PointLight(0xffffff,  1, 500,  2);

    plight.position.x = 0;
    plight.position.z = 0;
    plight.position.y = 190;
    plight.castShadow = true;

    //light.attach(sphere);
    scene.add(plight);
}

function addSun() {
    dirLight = new THREE.DirectionalLight(0xffffff, 1); //1);
    dirLight.position.set(2500, 5000, 1000);
    dirLight.castShadow = true;
    let size = 640 * 7;
    dirLight.shadow.camera.left = -size;
    dirLight.shadow.camera.right = size;
    dirLight.shadow.camera.bottom = -size;
    dirLight.shadow.camera.top = size;
    dirLight.shadow.camera.near = 3800;
    dirLight.shadow.camera.far = 7800;
    dirLight.shadow.bias = 0.0001;

    // scene.add (new THREE.CameraHelper(light.shadow.camera));

    var SHADOW_MAP_WIDTH = 4096, SHADOW_MAP_HEIGHT = 4096;
    dirLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    dirLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
    scene.add(dirLight);

}

function onProgress( xhr ) {

    if ( xhr.lengthComputable ) {

        updateProgressBar( xhr.loaded / xhr.total );

        console.log( Math.round( xhr.loaded / xhr.total * 100, 2 ) + '% downloaded' );

    }

}

function onError() {

    var message = "Error loading model";
    progressBarDiv.innerText = message;
    console.log( message );

}

function showProgressBar() {

    if (!progressBarDiv) {
        progressBarDiv = document.createElement( 'div' );
        progressBarDiv.innerText = "Loading...";
        progressBarDiv.style.fontSize = "3em";
        progressBarDiv.style.color = "#888";
        progressBarDiv.style.display = "block";
        progressBarDiv.style.position = "absolute";
        progressBarDiv.style.top = "50%";
        progressBarDiv.style.width = "100%";
        progressBarDiv.style.textAlign = "center";
    }

    document.body.appendChild( progressBarDiv );

}

function hideProgressBar() {

    document.body.removeChild( progressBarDiv );

}

function updateProgressBar( fraction ) {

    progressBarDiv.innerText = 'Loading... ' + Math.round( fraction * 100, 2 ) + '%';

}

function onWindowResize() {

    let res = {x: window.innerWidth, y: window.innerHeight };

    camera.aspect = res.x / res.y;
    camera.updateProjectionMatrix();

    renderer.setSize( res.x, res.y, false );

    render();
}

function animate() {

    if ( controls.isLocked ) {

        requestAnimationFrame( animate );

        let delta = clock.getDelta();

        updateControls(delta);

        render();
    }
}

function updateControls(delta) {

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions
    if (moveForward || moveBackward) {
        velocity.z -= direction.z * 2000.0 * delta;
    }
    if (moveLeft || moveRight)
        velocity.x -= direction.x * 2000.0 * delta;
    /*
    if ( onObject === true ) {

        velocity.y = Math.max( 0, velocity.y );
        canJump = true;

    }
    */

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    controls.getObject().position.y += (velocity.y * delta); // new behavior
    if (controls.getObject().position.y < playerCamHeight) {
        velocity.y = 0;
        controls.getObject().position.y = playerCamHeight;
        canJump = true;
    }

    let pos = controls.getObject().position;

    if (pos.x > absMaxDistance) {
        pos.x = absMaxDistance;
    } else if (pos.x < -absMaxDistance) {
        pos.x = -absMaxDistance;
    }
    if (pos.z > absMaxDistance) {
        pos.z = absMaxDistance;
    } else if (pos.z < -absMaxDistance) {
        pos.z = -absMaxDistance;
    }
}


function render() {
    // checkIntersect();
    renderer.render( scene, camera );
}
