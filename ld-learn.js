import * as THREE from './node_modules/three/build/three.module.js';
import { GUI } from './node_modules/three/examples/jsm/libs/dat.gui.module.js';
//import { MapControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from './node_modules/three/examples/jsm/controls/PointerLockControls.js';
import { MathExercise } from './exercises/Maths.js';
import { OperatorType } from './exercises/Maths.js';
import { GamepadControls } from './gfx/GamepadControls.js';
import { createText } from './gfx/Text.js';
import { addCrossHair } from './gfx/CrossHair.js';
import * as WORLD from './gfx/World.js';
import * as ANIM from './gfx/Animations.js';
import { initCar } from './gfx/Cars.js';

export var camera, controls, gpControls, scene, renderer, raycaster, intersectedObject;

var mouse = new THREE.Vector2();

var ambientSound;
var walkSound;
var tickSound;
var collectSound;
var newItemSound;
var okSounds = [];
var wrongSounds = [];

var clock = new THREE.Clock();

var mixer;
var players = [];
var currentPlayer;
var playerIdx;

var skyMesh;

var chrystalCount = 0;
var chrystals = new Set();

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();

var exerciseGroup;
var exerciseMeshes;
var currentHighlight;

var absMaxDistance = 0.5 * WORLD.plateSize;

var progressBarDiv;

var gameSettings = { playerCount: 1};

var gui, playersFolder, gfxFolder, gameFolder, playerInfo;

const okColor = 0x00ff00, wrongColor = 0xff0000, selectedEmissive = 0x0000ff;

var textEmissive = 0x000000;

const chrActions = {
    createSky : 3,
    createPlates : 1,
    createFences : 2,
    plantsMin : 4,
    plantsMax : 20,
    prepareRoads : 18, //18
    initRoads : 20, //20
    carsMin : 21,   //21
    carsMax : 50   //50
}

init();

function init() {
    initScene();
    initControls();
    initAudio(camera);
    initGUI();

    initPlayers(gameSettings.playerCount);
        
    createExercise();

    //render(); // remove when using next line for animation loop (requestAnimationFrame)
    animate();
}

function initControls() {

    playerInfo = document.getElementById('playerInfo');

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;
    // renderer.physicallyCorrectLights = true;
    document.body.appendChild( renderer.domElement );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 12000 );

    // camera.up = new THREE.Vector3(0, 0, 1);
    // camera.position.set(WORLD.plateSize, 85, WORLD.plateSize );
    camera.position.set(0, 85, WORLD.plateSize / 2);
    
    addCrossHair(camera);

    raycaster = new THREE.Raycaster();

    // raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, -1, 0 ), 0 , 1000);

    controls = new PointerLockControls( camera, document.body );
    gpControls = new GamepadControls( controls.getObject() );

    scene.add( controls.getObject() );

    var blocker = document.getElementById( 'blocker' );
    var instructions = document.getElementById( 'instructions' );

    instructions.addEventListener( 'click', function () {

        controls.lock();  

    }, false );

    controls.addEventListener( 'lock', function () {

        instructions.style.display = 'none';
        blocker.style.display = 'none';

        if (ambientSound && chrystalCount >= chrActions.plantsMin) ambientSound.play();

        document.addEventListener( 'click', onDocumentClick, false );

        clock.start();

        requestAnimationFrame( animate );

    } );

    controls.addEventListener( 'unlock', function () {

        blocker.style.display = 'block';
        instructions.style.display = '';

        if (ambientSound) ambientSound.pause();

        clock.stop();

        document.removeEventListener('click', onDocumentClick);
    } );

    var onKeyDown = function ( event ) {

        //console.log("down " + event.keyCode);

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

        }

    };

    var onKeyUp = function ( event ) {

        //console.log("up " + event.keyCode);

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

    /*
    // controls
    controls = new MapControls( camera, renderer.domElement );    
    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 100;
    controls.maxDistance = 2500;
    controls.maxPolarAngle = Math.PI / 2;

    */
    //
    window.addEventListener( 'resize', onWindowResize, false );

    // document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    
}

function initAudio(camera) {
    // create an AudioListener and add it to the camera
    var listener = new THREE.AudioListener();
    camera.add( listener );

    listener.setVolume = 0;

    // load a sound and set it as the Audio object's buffer
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load( 'sounds/ambient.ogg', function( buffer ) {
        // create a global audio source
        ambientSound = new THREE.Audio( listener );
        ambientSound.setBuffer( buffer );
        ambientSound.setLoop( true );
        ambientSound.setVolume( 0.3 );
    });

    audioLoader.load( 'sounds/walk.ogg', function( buffer ) {        
        walkSound = new THREE.Audio( listener );
        walkSound.setBuffer( buffer );
        walkSound.setLoop( false );
        walkSound.setVolume( 0.5 );        
    });

    audioLoader.load( 'sounds/collect.ogg', function( buffer ) {        
        collectSound = new THREE.Audio( listener );
        collectSound.setBuffer( buffer );
        collectSound.setLoop( false );
        collectSound.setVolume( 0.5 );        
    });

    audioLoader.load( 'sounds/dream.ogg', function( buffer ) {        
        newItemSound = new THREE.Audio( listener );
        newItemSound.setBuffer( buffer );
        newItemSound.setLoop( false );
        newItemSound.setVolume( 0.5 );        
    });

    audioLoader.load( 'sounds/tick.ogg', function( buffer ) {        
        tickSound = new THREE.PositionalAudio( listener );
        tickSound.setBuffer( buffer );
        tickSound.setRefDistance(100);
        tickSound.setVolume( 0.8 );
    });


    for (let idx = 1; idx <= 4; idx++)
    {
        audioLoader.load( 'sounds/ok_'+ idx +'.ogg', function( buffer ) {        
            let sound = new THREE.PositionalAudio( listener );
            sound.setBuffer( buffer );
            sound.setRefDistance(100);
            sound.setVolume( 1 );
            okSounds.push(sound);
        });
    }
    for (let idx = 1; idx <= 4; idx++)
    {
        audioLoader.load( 'sounds/wrong_'+ idx +'.ogg', function( buffer ) {        
            let sound = new THREE.PositionalAudio( listener );
            sound.setBuffer( buffer );
            sound.setRefDistance(100);
            sound.setVolume( 1 );
            wrongSounds.push(sound);
        });
    }
}


function initGUI() {

    gui = new GUI();

    gfxFolder = gui.addFolder ("Graphics settings");
    gameFolder = gui.addFolder("Game settings");

    gameFolder.add(gameSettings, "playerCount", 1, 8).step(1).onChange(function(value) {
         initPlayers(value);
      });
      
    playersFolder = gui.addFolder("Players");
    playersFolder.open();
}

function initScene() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xaaaaaa );

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
    loader.load('./gfx/textures/sky_day.jpg',
        //loader.load('./gfx/nightsky.jpg', 
        texture => {
            var skyGeo = new THREE.SphereBufferGeometry(12 * WORLD.plateSize, 160, 160); //, 0, 2*Math.PI, 0, Math.PI/2);
            var skyMat = new THREE.MeshLambertMaterial({ map: texture, flatShading: true, emissive: 0x8888ff, emissiveIntensity: 0 }); //1
            // var skyMat = new THREE.MeshLambertMaterial({ map: texture, shading: THREE.FlatShading, emissive: 0x00 });
            skyMat.side = THREE.BackSide;
            skyMesh = new THREE.Mesh(skyGeo, skyMat);  
        }, xhr => {
            console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        }, error => { console.log("An error happened" + error); });

    /*
    var light = new THREE.DirectionalLight(0x002288);
    light.position.set(-1, -1, -1);
    scene.add(light);
    */

    //var light = new THREE.AmbientLight(0x222222);
    //scene.add(light);


    progressBarDiv = document.createElement( 'div' );
    progressBarDiv.innerText = "Loading...";
    progressBarDiv.style.fontSize = "3em";
    progressBarDiv.style.color = "#888";
    progressBarDiv.style.display = "block";
    progressBarDiv.style.position = "absolute";
    progressBarDiv.style.top = "50%";
    progressBarDiv.style.width = "100%";
    progressBarDiv.style.textAlign = "center";

    showProgressBar();

    if (WORLD.model) {
        scene.remove(WORLD.model);
    }

    WORLD.initScene(function ( newModel ) {
        scene.add(newModel);        
        mixer = new THREE.AnimationMixer(newModel);

        absMaxDistance = WORLD.worldPlates * WORLD.plateSize;

        // addChrystal();

        hideProgressBar();
        render();
    }, onProgress, onError );
}

function addSun() {
    let light = new THREE.DirectionalLight(0xffffff, 1); //1);
    light.position.set(2500, 5000, 1000);
    light.castShadow = true;
    let size = WORLD.plateSize * WORLD.plateCounter;
    light.shadow.camera.left = -size;
    light.shadow.camera.right = size;
    light.shadow.camera.bottom = -size;
    light.shadow.camera.top = size;
    light.shadow.camera.near = 3800;
    light.shadow.camera.far = 7800;
    light.shadow.bias = 0.0001;

    // scene.add (new THREE.CameraHelper(light.shadow.camera));

    var SHADOW_MAP_WIDTH = 4096, SHADOW_MAP_HEIGHT = 4096;
    light.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    light.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
    scene.add(light);

    let action = mixer.clipAction(ANIM.createHighlightAnimation(1, 1), light);
    action.clampWhenFinished = true;
    action.setLoop(THREE.LoopOnce).setDuration(5).play();
}

function createSky() {
    scene.add(skyMesh);

    let action = mixer.clipAction(ANIM.createHighlightAnimation(1, 1, true), skyMesh.material);
    action.clampWhenFinished = true;
    action.setLoop(THREE.LoopOnce).setDuration(3).play();

    // lights
    addSun();

    if (newItemSound && !newItemSound.isPlaying)
        newItemSound.play();
        
}

function addChrystal() {
    let newChrystal = WORLD.chrystal.clone();

    let parcelIdx = Math.floor(Math.random() * (WORLD.freeParcels.length));

    let parcel = WORLD.freeParcels[parcelIdx];
    WORLD.freeParcels.splice(parcelIdx, 1);

    if (parcel) {

        parcel.occupied = true;

        newChrystal.position.x = parcel.x;
        newChrystal.position.z = parcel.z;

        newChrystal.parcel = parcel;

        /*
        let cLight = new THREE.PointLight({color: 0xff00ff, intensity: 0.2, distance: 10, decay: 5.0});
        cLight.position.y = -5
        newChrystal.add(cLight);
*/
        let material = new THREE.LineBasicMaterial({ linewidth: 1 });
        material.color.setHSL(Math.random(), 1, 0.9 );
        let geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        geometry.vertices.push(new THREE.Vector3(0, -2000, 0));
        let line = new THREE.Line(geometry, material);
        line.position.y = -40;
        newChrystal.add(line);
        newChrystal.line = line;

        WORLD.model.add(newChrystal);

        var action = mixer.clipAction(ANIM.createRotationAnimation(1, 'y'), newChrystal);
        action.setLoop(THREE.LoopRepeat).setDuration(1).play();

        action = mixer.clipAction(ANIM.createFallAnimation(1, -1500, newChrystal.position.y), newChrystal);
        action.setLoop(THREE.LoopOnce).setDuration(20).fadeOut(4).play();

        action = mixer.clipAction(ANIM.createScaleAnimation(1, 'y'), line);
        action.setLoop(THREE.LoopOnce).setDuration(360).play();

        chrystals.add(newChrystal);

        updatePlayerInfo();
    } else {
        console.log('No free parcel found for chrystal!');
        console.log(parcelIdx);
        console.log(WORLD.freeParcels);        
    }

}

function createExercise() {

    if (exerciseGroup) {
        scene.remove(exerciseGroup);
    }

    let x = new MathExercise(OperatorType.Substraction, 10, 10, 5); //, 10);
    // let x = new MathExercise(OperatorType.Multiplication, 10, 100, 5); //, 10);
    // let x = new MathExercise(OperatorType.Addition, 10, 10, 5); //, 10);
    exerciseGroup = new THREE.Group();
    let xtext = createText(x.description, function(mesh){
        if (tickSound)  mesh.add(tickSound);
    });
    xtext.position.y = 100;
    exerciseGroup.add(xtext);
    let resultsGroup = new THREE.Group();
    let idx = 0;

    exerciseMeshes = [];

    let wrongIdx = 0;

    for (let result of x.results) {
        let rtext = createText(result.toString(), function(mesh){
            exerciseMeshes.push(mesh);
        });

        rtext.isResult = (result == x.result);

        if (rtext.isResult) {
            let okIdx = Math.floor(Math.random() * 4);
            if (okSounds.length > okIdx) {
                rtext.add(okSounds[okIdx]);
                rtext.sound = okSounds[okIdx];
            }
        } else {
            if (wrongSounds.length > 0) {
                rtext.add(wrongSounds[wrongIdx % wrongSounds.length]);
                rtext.sound = wrongSounds[wrongIdx % wrongSounds.length];
                wrongIdx++;
            }
        }

        rtext.translateX((idx++ * 150) - 300);
        resultsGroup.add(rtext);
    }    
    exerciseGroup.add(resultsGroup);
    exerciseGroup.position.y = 200;
    exerciseGroup.position.z = -WORLD.plateSize;

    scene.add(exerciseGroup);

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

    document.body.appendChild( progressBarDiv );

}

function hideProgressBar() {

    document.body.removeChild( progressBarDiv );

}

function updateProgressBar( fraction ) {

    progressBarDiv.innerText = 'Loading... ' + Math.round( fraction * 100, 2 ) + '%';

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onDocumentClick( event ) {
    event.preventDefault();

    if (currentHighlight) {
        evaluateAnswer(currentHighlight);
    }
}

function evaluateAnswer(obj) {
    obj.parent.children[0].material.color.setHex(obj.parent.isResult ? okColor : wrongColor);
    if (obj.parent.sound) {
        if (obj.parent.sound.isPlaying) obj.parent.sound.stop();
        obj.parent.sound.play();
    }
    highlightMesh(obj, textEmissive); // obj.parent.isResult ? okColor : wrongColor);
    if (obj.parent.isResult) {
        addChrystal();
    }
    else {
        
        // show solution
        for (let mesh of exerciseMeshes) {
            if (mesh.parent.isResult) {
                // window.setTimeout( mesh => {
                    mesh.parent.children[0].material.color.setHex(okColor);
                // }, 500);
                break;
            }
        }
    }
    exerciseMeshes = [];
    currentHighlight = null;
    window.setTimeout(createExercise, 1500);
}

function animate() {

    
    if ( controls.isLocked ) {

        requestAnimationFrame( animate );

        //raycaster.ray.origin.copy( controls.getObject().position );
        //raycaster.ray.origin.y -= 10;

        //var intersections = raycaster.intersectObjects( objects );

        //var onObject = intersections.length > 0;

        //var delta = 0.75 * clock.getDelta();

        let delta = clock.getDelta();

        mixer.update( delta );

        updateControls(delta);

        checkExerciseIntersections();

        render();
    }
}

function checkChrystals() {
    let foundChrystal;
    let temp = new THREE.Vector3();
    let objPos = controls.getObject().position;//.getWorldPosition();

    for (let chr of chrystals) {

        let chrPos = chr.getWorldPosition(temp);

        // playerInfo.innerHTML = objPos.x + ", " + objPos.z + " -> " + chrPos.x + ", " + chrPos.z;

        if (chrPos.distanceTo( objPos ) < 120 ) {
            foundChrystal = chr;
            console.log('Christal found!');
            break;
        }
    }
    if (foundChrystal){
        chrystals.delete(foundChrystal);
        WORLD.model.remove(foundChrystal);

        // remove animations from old instance
        mixer.uncacheRoot(foundChrystal);
        mixer.uncacheRoot(foundChrystal.line);

        if (collectSound) {
            if (collectSound.isPlaying) collectSound.stop();
         collectSound.play();
        }
        chrystalCount++;

        let parcel = foundChrystal.parcel;
        parcel.occupied = false;
        WORLD.freeParcels.push[parcel];

        // update display
        updatePlayerInfo();

        // actions        
        performChrystalAction();
    }
}

function performChrystalAction() {

    if (chrystalCount == chrActions.createSky) {
        createSky();
    }

    if (chrystalCount == chrActions.createPlates) {
        WORLD.createPlates();
        absMaxDistance = WORLD.worldPlates * WORLD.plateSize;
    }
    if (chrystalCount == chrActions.createFences) {
        WORLD.createFences();
    }

    if (chrystalCount >= chrActions.plantsMin) {
        if (ambientSound && !ambientSound.isPlaying) ambientSound.play();
    
        if ( chrystalCount <= chrActions.plantsMax) {
            WORLD.populatePlants(3, 10, mixer);
        }
    }

    if (chrystalCount == chrActions.prepareRoads) {
        WORLD.prepareRoads();
    }
    if (chrystalCount == chrActions.initRoads) {
        WORLD.initRoads(function (newModel) {
            // play transition sound
            if (newItemSound && !newItemSound.isPlaying)
                newItemSound.play();
        }, onProgress, onError);
    }
    if (chrystalCount >= chrActions.carsMin && chrystalCount <= chrActions.carsMax) {
        addCar();
    }
}

function addCar() {
    initCar(0, function (car) {
        WORLD.model.add(car);

        let ccw = (chrystalCount % 2 == 0); // every second counter-clockwise
        let clip = ANIM.createRoadAnimation((WORLD.roadPlates * 2) + (0.28 * (ccw ? 1 : -1)), WORLD.plateSize, ccw);
        var action = mixer.clipAction(clip, car);        
        console.log (clip.path.getLength());
        let duration =  0.0025 * clip.path.getLength();
        action.setLoop(THREE.LoopRepeat).setDuration(duration).play();

        for (let wheel of car.rWheels) {
            var action = mixer.clipAction(ANIM.createRotationAnimation(1, 'z'), wheel);
            action.setLoop(THREE.LoopRepeat).setDuration(1).play();
        }
        for (let wheel of car.lWheels) {
            var action = mixer.clipAction(ANIM.createRotationCcwAnimation(1, 'z'), wheel);
            action.setLoop(THREE.LoopRepeat).setDuration(1).play();
        }
    });
}

function checkExerciseIntersections() {
    if (exerciseMeshes.length > 0) {
        for (let mesh of exerciseMeshes) {
            highlightMesh(mesh, textEmissive);
        }

        exerciseGroup.lookAt(controls.getObject().position);

        raycaster.setFromCamera({ x: 0, y: 0 }, camera);
        var intersects = raycaster.intersectObjects(exerciseMeshes);
        if (intersects.length > 0) {
            highlightMesh(intersects[0].object, selectedEmissive);
            if (intersects[0].object != currentHighlight)
            {
                if (tickSound) {
                    if (tickSound.isPlaying) tickSound.stop;
                    tickSound.play();
                } 
                currentHighlight = intersects[0].object;
            }
        } else {
            currentHighlight = null;
        }

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
        velocity.z -= direction.z * 4000.0 * delta;
        if (walkSound && !walkSound.isPlaying) walkSound.play();
    }
    if (moveLeft || moveRight)
        velocity.x -= direction.x * 4000.0 * delta;
    /*
    if ( onObject === true ) {

        velocity.y = Math.max( 0, velocity.y );
        canJump = true;

    }
    */

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    controls.getObject().position.y += (velocity.y * delta); // new behavior
    if (controls.getObject().position.y < 85) {
        velocity.y = 0;
        controls.getObject().position.y = 85;
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

    if (velocity.x != 0 || velocity.z != 0) {
        checkChrystals();
    }

}

function highlightMesh(mesh, colorHex)
{
    mesh.parent.children[0].material.emissive.setHex(colorHex);
}

function render() {
    // checkIntersect();
    renderer.render( scene, camera );
}

function initPlayers(count)
{
    if (players) {
        while (players.length > count) {
            let player = players.pop();
            if (playersFolder && player.controller) {
                playersFolder.remove(player.controller);
            }
        }
    }
    else {
        players = [];
    }

    let idx = players.length;

    while (players.length < count) {        
        players.push({index: idx, name: "Player" + (idx + 1), color: new THREE.Color() });
        let player = players[idx++];
        player.color.setHSL(idx/count, 1, 0.5);
    
        if (playersFolder) {
            player.controller = playersFolder.add(player, "name").name("Name");
        }
    }

    currentPlayer = players[0];    
    
    updatePlayerInfo();
}

function updatePlayerInfo() {
    if (playerInfo) {
        playerInfo.innerHTML = currentPlayer.name + ": " + chrystalCount + " ("+ chrystals.size +")";
    }
}