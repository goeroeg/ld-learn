// import * as THREE from './node_modules/three/build/three.module.js';
// import { GUI } from './node_modules/three/examples/jsm/libs/dat.gui.module.js';
import { GUI } from './web_modules/three/examples/jsm/libs/dat.gui.module.js';
// import { MapControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from './web_modules/three/examples/jsm/controls/PointerLockControls.js';
import { MathExercise } from './exercises/Maths.js';
import { OperatorType } from './exercises/Maths.js';
import { GamepadControls } from './gfx/GamepadControls.js';
import { createText } from './gfx/Text.js';
import { addCrossHair } from './gfx/CrossHair.js';
import * as WORLD from './gfx/World.js';
import * as ANIM from './gfx/Animations.js';
import { initCar } from './gfx/Cars.js';
import { initGuy, BodyParts } from './gfx/Guy.js';
import { updateMapData } from './gfx/MiniMap.js';
import { initCow, initHorse } from './gfx/Animals.js';

export var camera, controls, gpControls, scene, renderer, raycaster, intersectedObject;

var fps = [];

var dirLight;

var mouse = new THREE.Vector2();

var listener;
var ambientSound;
var sphereSound;
var motorSoundBuffer;
var walkSound;
var tickSound;
var collectSound;
var newItemSound;
var okSounds = [];
var wrongSounds = [];

var motorSounds = [];
var cars = [];

var clock = new THREE.Clock();

var playerGuy;
const guyOffset = 20;
var lastGuyPos = new THREE.Vector3();

const jumpInitialVel = 350;

var mixer;

var skyMesh;

var chrystalCount = 0;
var chrystals = new Set();

const moveDir = { forward:0, backward:1, left:2, right:3 }
var moveActive = [ false, false, false, false ];

var canJump = false;

var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();

var exerciseGroup;
var exerciseMeshes;
var currentHighlight;

var absMaxDistance = 0.5 * WORLD.plateSize - guyOffset;

var progressBarDiv;


var resolutions = [{ x: 0, y: 0 }, { x: 320, y: 240 }, {x: 640, y: 480 }, { x: 1024, y: 768 }, { x: 1280, y: 800 } ,{ x: 1920, y: 1080 }]
var resolutionNames  = { 'Auto': 0, '320x240': 1, '640x480': 2, '1024x768': 3, "1280x800": 4, HD: 5 };
var qualityNames = { High: 1, Low : 2};
var audioSettings = { enabled : true, volume: 100 }
var gfxSettings = { resolution: resolutionNames.Auto, quality: qualityNames.High, fullScreen: false, shadows: 3 , antiAlias: true , showFPS: false}
var gameSettings = { 
    itemAmount:100 , 
    add : true, addMax : 100, addResMax : 100, addSym: '+',
    sub : true, subMax : 100, subResMax : 100, subSym: '-',
    multi : true, multiMax : 10, multiResMax : 100, multiSym: '·',
    div : false, divMax : 100, divResMax : 10, divSym: ':',
    numChoices : 5 };

const defaultBodyColor = [180, 0, 0];
const defaultLegsColor = [30, 90, 168];

var playerSettings = {name:'Player' }

var gui, playersFolder, gfxFolder, audioFolder, gameFolder;

var isTouch = false;

var playerInfo = document.getElementById('playerInfo');
var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );

var touchMoveForward = document.getElementById('touchForward');
var touchMoveBack = document.getElementById('touchBack');
var touchMoveLeft = document.getElementById('touchLeft');
var touchMoveRight = document.getElementById('touchRight');

const touchControlDirs = new Map();
var touchMoveTime;

var touchCameraControls = document.getElementById('cameraControls');
var miniMap = document.getElementById('miniMap');
var miniMapDiv = document.getElementById('miniMapDiv');

var touchCamPos = new THREE.Vector2();

var gameActive = false;

const okColor = 0x00ff00, wrongColor = 0xff0000, selectedEmissive = 0x0000ff;

var textEmissive = 0x000000;

const chrActions = {
    createPlates : 1,
    createFences : 2,
    createSky : 3,
    plantsMin : 4,
    plantsMax : 20,
    prepareRoads : 15, //15
    initRoads : 20, //20
    carsMin : 25,   //21
    carsMax : 50,   //50
    animalsMin : 15, // 15
    animalsMax : 25, // 25
    musicSphere : 30
}

init();

function init() {
    initScene();
    initControls();
    initAudio();
    initGUI();

    createExercise();
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

    // document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 12000 );

    // camera.up = new THREE.Vector3(0, 0, 1);
    // camera.position.set(WORLD.plateSize, 85, WORLD.plateSize );
    camera.position.set(0, 85, WORLD.plateSize / 2);
    
    addCrossHair(camera);

    raycaster = new THREE.Raycaster();

    // raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, -1, 0 ), 0 , 1000);

    controls = new PointerLockControls( camera, document.body );
    gpControls = new GamepadControls( controls );

    scene.add( controls.getObject() );

    isTouch = ('ontouchstart' in window);
    
    initTouchControls(!isTouch);

    if (isTouch) {
        instructions.addEventListener( 'touchstart', function (e) {
            openFullscreen();
            window.history.pushState({}, '');
            startGame();         
        }, false );
         
        /*
        document.getElementById('clickSpan').addEventListener( 'click', function () {
            startGame();
        }, false );
        */

        window.addEventListener('popstate', function() {
            pauseGame();
        });

    } else {
        instructions.addEventListener( 'click', function () {
            controls.lock();
        }, false );

        controls.addEventListener( 'lock', function () {
            startGame();
        } );

        controls.addEventListener( 'unlock', function () {
            pauseGame();
        } );
    }

    var onKeyDown = function ( event ) {

        //console.log("down " + event.keyCode);

        switch ( event.keyCode ) {

            case 38: // up
            case 87: // w
                toggleMove(true, moveDir.forward, touchMoveForward);
                break;

            case 37: // left
            case 65: // a
            toggleMove(true, moveDir.left, touchMoveLeft);
                break;

            case 40: // down
            case 83: // s
            toggleMove(true, moveDir.backward, touchMoveBack);
                break;

            case 39: // right
            case 68: // d
            toggleMove(true, moveDir.right, touchMoveRight);
                break;

            case 32: // space
                if ( canJump === true ) velocity.y += jumpInitialVel;
                canJump = false;
                break;

            case 8: // backspace
                if ( clock.running ) {
                    clock.stop();
                } else {
                    clock.start();
                }
                break;
        }

    };

    var onKeyUp = function ( event ) {

        //console.log("up " + event.keyCode);

        switch ( event.keyCode ) {

            case 27: //ESC
                if (controls.isLocked) {
                    controls.unlock();
                } else if (gameActive){
                    pauseGame();
                }
                break;

            case 38: // up
            case 87: // w
                toggleMove(false, moveDir.forward, touchMoveForward);
                break;

            case 37: // left
            case 65: // a
                toggleMove(false, moveDir.left, touchMoveLeft);
                break;

            case 40: // down
            case 83: // s
                toggleMove(false, moveDir.backward, touchMoveBack);
                break;

            case 39: // right
            case 68: // d
                toggleMove(false, moveDir.right, touchMoveRight);
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

function initTouchControls(hide) {
    if (hide) {
        document.getElementById('touchControls').style.display = 'none';
    } else {
        document.getElementById('touchControls').style.display = '-webkit-box';
        document.getElementById('touchControls').style.display = '-moz-box';
        document.getElementById('touchControls').style.display = 'box';

        touchCameraControls.addEventListener("touchstart", onCamControlsTouch, false);
        touchCameraControls.addEventListener("touchmove", onCamControlsTouchMove, false);
        touchCameraControls.addEventListener("touchend", onCamControlsRelease, false);

        touchControlDirs.set(touchMoveForward, moveDir.forward);
        touchControlDirs.set(touchMoveBack, moveDir.backward);
        touchControlDirs.set(touchMoveLeft, moveDir.left);
        touchControlDirs.set(touchMoveRight, moveDir.right);

        touchMoveForward.addEventListener("touchstart", onMoveControlTouch, false);
        touchMoveForward.addEventListener("touchend", onMoveControlRelease, false);

        touchMoveBack.addEventListener("touchstart", onMoveControlTouch, false);
        touchMoveBack.addEventListener("touchend", onMoveControlRelease, false);

        touchMoveLeft.addEventListener("touchstart", onMoveControlTouch, false);
        touchMoveLeft.addEventListener("touchend", onMoveControlRelease, false);

        touchMoveRight.addEventListener("touchstart", onMoveControlTouch, false);
        touchMoveRight.addEventListener("touchend", onMoveControlRelease, false);

        /*
        touchMoveForward.addEventListener("mousedown", onMoveControlTouch, false);
        touchMoveForward.addEventListener("mouseup", onMoveControlRelease, false);

        touchMoveBack.addEventListener("mousedown", onMoveControlTouch, false);
        touchMoveBack.addEventListener("mouseup", onMoveControlRelease, false);

        touchMoveLeft.addEventListener("mousedown", onMoveControlTouch, false);
        touchMoveLeft.addEventListener("mouseup", onMoveControlRelease, false);

        touchMoveRight.addEventListener("mousedown", onMoveControlTouch, false);
        touchMoveRight.addEventListener("mouseup", onMoveControlRelease, false);
        */
    }
}

function onCamControlsTouchMove(e) {
    e.preventDefault();
    let touch = e.changedTouches[0];
    let factor = 0.0075;
    controls.rotateCamera((touch.pageX-touchCamPos.x) * factor, (touch.pageY - touchCamPos.y ) * factor);
    touchCamPos.x = touch.pageX;
    touchCamPos.y = touch.pageY;
}

function onCamControlsTouch(e) {
    e.preventDefault();
    highlightTouchControl(touchCameraControls);
    let touch = e.changedTouches[0];
    touchCamPos.x = touch.pageX;
    touchCamPos.y = touch.pageY;
}

function onCamControlsRelease(e) {
    e.preventDefault();
    resetTouchControl(touchCameraControls);

    let touch = e.changedTouches[0];
    if (currentHighlight && ((touchCamPos.x - touch.pageX) * (touchCamPos.y - touch.pageY)) < 10) {
        evaluateAnswer(currentHighlight);
    }  
}

function onMoveControlTouch(e) {
    e.preventDefault();
    let target = e.target || e.source;

    if (e.timeStamp - touchMoveTime < 250) {
        if ( canJump === true ) velocity.y += jumpInitialVel;
        canJump = false;
    }
    toggleMove(true, touchControlDirs.get(target), target);
}

function onMoveControlRelease(e) {
    e.preventDefault();
    let target = e.target || e.source;
    toggleMove(false, touchControlDirs.get(target), target);
    touchMoveTime = e.timeStamp;
}

function highlightTouchControl(control) {
    control.style.background = 'rgba(128,128,128,0.6)';
}

function resetTouchControl(control) {
    control.style.background = '';
}

function toggleMove(activate, moveDirIndex, control) {
    if (control) {
        if (activate) {
            highlightTouchControl(control);
        } else {
            resetTouchControl(control);
        }
    }
    moveActive[moveDirIndex] = activate;
}

function pauseGame() {
    gameActive = false;
    updateBlocker(false);
    if (ambientSound && ambientSound.isPlaying)
        ambientSound.pause();
    if (sphereSound && sphereSound.isPlaying)
        sphereSound.pause();
    for (let ms of motorSounds) {
        if (ms.isPlaying)
            ms.pause();
    }
    clock.stop();
    document.removeEventListener('click', onDocumentClick);
    touchCameraControls.removeEventListener('click', onDocumentClick);
}

function startGame() {
    updateBlocker(true);
    if (ambientSound && chrystalCount >= chrActions.plantsMin && !ambientSound.isPlaying)
        ambientSound.play();
    if (sphereSound && chrystalCount >= chrActions.musicSphere && !sphereSound.isPlaying)
        sphereSound.play();
    for (let ms of motorSounds) {
        if (!ms.isPlaying)
            ms.play();
    }
    document.addEventListener('click', onDocumentClick, false);
    touchCameraControls.addEventListener('click', onDocumentClick, false);
    clock.start();
    gameActive = true;
    requestAnimationFrame(animate);
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

function initAudio() {
    // create an AudioListener and add it to the camera
    listener = new THREE.AudioListener();
    camera.add( listener );

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

    audioLoader.load( 'sounds/motor.ogg', function( buffer ) {     
       motorSoundBuffer = buffer;
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

    audioLoader.load( 'sounds/sphere-music.ogg', function( buffer ) {        
        sphereSound = new THREE.PositionalAudio( listener );
        sphereSound.setBuffer( buffer );
        sphereSound.setRefDistance(150);
        sphereSound.setVolume( 0.8 );
        sphereSound.setLoop( true );
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

    gui = new GUI( { autoPlace: false } );

    gui.useLocalStorage = true;

    gui.remember(gfxSettings);
    gui.remember(audioSettings);
    gui.remember(gameSettings);
    gui.remember(playerSettings);

    gfxFolder = gui.addFolder ("Graphics settings");
    
    gfxFolder.add(gfxSettings, "resolution", resolutionNames).name("Resolution").onChange(function(value) {
        // update resolution 
        onWindowResize();
    });

    gfxFolder.add(gfxSettings, "quality", qualityNames).name("Render quality").onChange(function(value) {
        // update resolution 
        onWindowResize();
    });
        
    gfxFolder.add(gfxSettings, "showFPS").name("Show FPS").onChange(function(value){
        if (!value) updatePlayerInfo();
    });

    /*
    gfxFolder.add(gfxSettings, "fullScreen").name("Full screen").onChange(function(value) {
        if (value) {
            openFullscreen();
        } else {
            closeFullscreen();
        }
    }).listen()
    */
    
    /* removed as it doesn't really impact performance and also the vosible results are very similar
    gfxFolder.add(gfxSettings, "shadows", 1, 4, 1).name("Shadows").onChange(function(value) {
        // update shadows
        console.log('shadows: ' + value);
        switch(value) {    
            case 1 :
                renderer.shadowMap.type = THREE.BasicShadowMap;
                break;       
            case 2 :            
                renderer.shadowMap.type = THREE.PCFShadowMap;
                break;
            case 3 :
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                break;
            case 3 :
                renderer.shadowMap.type = THREE.VSMShadowMap;
                break;
        }
        renderer.shadowMap.needsUpdate = true;
        render();
    });
    */

    /*
    gfxFolder.add(gfxSettings, "antiAlias").name("Antialias").onChange(function(value) {
        // reset context - so it's a bit complex
    });
    */

    onWindowResize(false);

    audioFolder = gui.addFolder("Audio settings");
    audioFolder.add(audioSettings, "enabled").name("Enabled").onChange(function (value) {
        setMasterVolume();
    });
    audioFolder.add(audioSettings, "volume", 0, 100).name("Volume").step(1).onChange(function (value) {
        setMasterVolume();
    });

    setMasterVolume();

    gameFolder = gui.addFolder("Game settings");
    gameFolder.add(gameSettings, "itemAmount", 10, 200).step(10).name("Obj density %");

    playersFolder = gui.addFolder("Player settings");
    playersFolder.add(playerSettings, "name").name("Name").onChange(function(value) {
        updatePlayerInfo();
    });

    playerSettings.resetColor = function () {
        playerSettings.bodyColor = defaultBodyColor;
        playerSettings.legsColor = defaultLegsColor;
        
        updateGuyBodyColor(playerSettings.bodyColor);
        updateGuyLegsColor(playerSettings.legsColor);
    }
    playerSettings.resetColor();

    playersFolder.addColor(playerSettings, "bodyColor").name("Body color").listen().onChange(function(value) {
        // compatibilty if previously other value stored
        if (value[0] === undefined) {
            value = defaultBodyColor;
            playerSettings.bodyColor = value;
        }

        updateGuyBodyColor(value);        
    });
    playersFolder.addColor(playerSettings, "legsColor").name("Legs color").listen().onChange(function(value) {
        if (value[0] === undefined) {
            value = defaultLegsColor;
            playerSettings.legsColor = value;
        }

        updateGuyLegsColor(value);
    });

    playersFolder.add(playerSettings, "resetColor").name("Reset colors");

    // playersFolder.add(playerSettings, "grade", 0, 4).step(1).name("Grade (difficulty)");

    // playersFolder.open();

    var exFolder = gui.addFolder("Exercise settings");

    var additionFolder = exFolder.addFolder("Addition (+)");
    additionFolder.add(gameSettings, "add").name("Enabled");
    additionFolder.add(gameSettings, "addMax", [10, 100]).name("Operand max");
    additionFolder.add(gameSettings, "addResMax", [10, 20, 100, 200]).name("Result max");
    additionFolder.open();
    
    var subtractionFolder = exFolder.addFolder("Subtraction (-)");
    subtractionFolder.add(gameSettings, "sub").name("Enabled");
    subtractionFolder.add(gameSettings, "subMax", [10, 20, 100]).name("Operand max");
    // subtractionFolder.add(gameSettings, "subResMax", [10, 100]).name("Result max");
    subtractionFolder.open();

    var multiplicationFolder = exFolder.addFolder("Multiplication (x)");
    multiplicationFolder.add(gameSettings, "multi").name("Enabled");
    multiplicationFolder.add(gameSettings, "multiMax", [10, 100]).name("Operand max");
    multiplicationFolder.add(gameSettings, "multiSym", [ '·', 'x', '*' ]).name("Symbol");
    // multiplicationFolder.add(gameSettings, "multiResMax", [10, 100]).name("Result max");
    multiplicationFolder.open();
      
    var divisionFolder = exFolder.addFolder("Division (/)");
    divisionFolder.add(gameSettings, "div").name("Enabled");
    // divisionFolder.add(gameSettings, "divMax", [10, 100]).name("Operand max");
    divisionFolder.add(gameSettings, "divResMax", [10, 100]).name("Result max");
    divisionFolder.add(gameSettings, "divSym", [ ':', '/' ]).name("Symbol");
    divisionFolder.open();

    // exFolder.add(gameSettings, "numChoices", 2, 5).step(1).name("Choices");

    // exFolder.open();
    let guiContainer = document.getElementById('guiContainer');
    guiContainer.appendChild(gui.domElement);

    updatePlayerInfo();
}

function setMasterVolume() {
    if (listener) {
        listener.setMasterVolume(audioSettings.enabled ? audioSettings.volume / 100 : 0);
    }
}

function updateGuyLegsColor(value) {
    if (playerGuy) {
        let r = value[0] / 255;
        let g = value[1] / 255;
        let b = value[2] / 255;
        playerGuy.bodyParts.get(BodyParts.Hip).material[0].color.setRGB(r, g, b);
        playerGuy.bodyParts.get(BodyParts.RightLeg).material[0].color.setRGB(r, g, b);
        playerGuy.bodyParts.get(BodyParts.LeftLeg).material[0].color.setRGB(r, g, b);
    }
}

function updateGuyBodyColor(value) {
    if (playerGuy) {
        let r = value[0] / 255;
        let g = value[1] / 255;
        let b = value[2] / 255;
        playerGuy.bodyParts.get(BodyParts.Torso).material[0].color.setRGB(r, g, b);
        playerGuy.bodyParts.get(BodyParts.RightArm).material[0].color.setRGB(r, g, b);
        playerGuy.bodyParts.get(BodyParts.LeftArm).material[0].color.setRGB(r, g, b);
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


    

    showProgressBar();

    if (WORLD.model) {
        scene.remove(WORLD.model);
    }

    mixer = new THREE.AnimationMixer(scene);

    WORLD.initScene(function ( newModel ) {
        scene.add(newModel);        
        
        absMaxDistance = WORLD.worldPlates * WORLD.plateSize - guyOffset;

        // addChrystal();

        hideProgressBar();
        render();
        updateBlocker(false);

        updateMapData(miniMap, -Math.PI/2, 0, 0);

    }, onProgress, onError );

    initGuy(function (guy) {
        playerGuy = guy;

        updateGuyBodyColor(playerSettings.bodyColor);
        updateGuyLegsColor(playerSettings.legsColor);

        scene.add(playerGuy);

        updateControls(0);
        initPlayerGuyAnim();
        
    }, onProgress, onError);
}

function initPlayerGuyAnim() {
    playerGuy.anims = [];
    var action = mixer.clipAction(ANIM.createWalkAnimation(1, Math.PI / 6, 'x'), playerGuy.bodyParts.get(BodyParts.RightLeg));
    action.setLoop(THREE.LoopRepeat).setDuration(0.6);
    playerGuy.anims.push(action);
    action = mixer.clipAction(ANIM.createWalkAnimation(1, -Math.PI / 6, 'x'), playerGuy.bodyParts.get(BodyParts.LeftLeg));
    action.setLoop(THREE.LoopRepeat).setDuration(0.6);
    playerGuy.anims.push(action);
    action = mixer.clipAction(ANIM.createWalkAnimation(1, -Math.PI / 12, 'x'), playerGuy.bodyParts.get(BodyParts.RightArm));
    action.setLoop(THREE.LoopRepeat).setDuration(0.6);
    playerGuy.anims.push(action);
    action = mixer.clipAction(ANIM.createWalkAnimation(1, Math.PI / 12, 'x'), playerGuy.bodyParts.get(BodyParts.LeftArm));
    action.setLoop(THREE.LoopRepeat).setDuration(0.6);
    playerGuy.anims.push(action);

    playerGuy.walk = function () {
        playerGuy.isWalking = true;        
        for (let anim of playerGuy.anims) {
            if (anim.isRunning()) {
                anim.fadeIn(0.3);
            } else {
                anim.reset().play();
            }
        }
    };
    playerGuy.stop = function () {
        for (let anim of playerGuy.anims) {
            anim.fadeOut(0.2);
            // anim.stop();
        }
        playerGuy.isWalking = false;
    };
}

function addSun() {
    dirLight = new THREE.DirectionalLight(0xffffff, 0); //1);
    dirLight.position.set(2500, 5000, 1000);
    dirLight.castShadow = true;
    let size = WORLD.plateSize * WORLD.plateCounter;
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

    let action = mixer.clipAction(ANIM.createHighlightAnimation(1, 1), dirLight);
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

function addMusicSphere() {
    let sphere = WORLD.sphere; // .clone();
    if (WORLD.freeParcels.length > 0) {

        let parcelIdx = Math.floor(Math.random() * (WORLD.freeParcels.length));

        let parcel = WORLD.freeParcels[parcelIdx];
        WORLD.freeParcels.splice(parcelIdx, 1);

        parcel.occupied = true;
        parcel.mapObjId = WORLD.MapObjectId.msphere;

        sphere.position.x = parcel.x;
        sphere.position.z = parcel.z;        

        // WORLD.model.add(sphere);

        let light = new THREE.PointLight(0xffa500,  1, 500,  2);

        light.position.x = parcel.x;
        light.position.z = parcel.z;
        light.position.y = -80;
        // cLight.target = sphere;
        light.castShadow = true;

        light.attach(sphere);
        WORLD.model.add(light);

        sphere.add(sphereSound);
        if (!sphereSound.isPlaying) sphereSound.play();
    }
}

function addChrystal() {
    let newChrystal = WORLD.chrystal.clone();

    if (WORLD.freeParcels.length > 0) {

        let parcelIdx = Math.floor(Math.random() * (WORLD.freeParcels.length));

        let parcel = WORLD.freeParcels[parcelIdx];
        WORLD.freeParcels.splice(parcelIdx, 1);

        parcel.occupied = true;
        parcel.mapObjId = WORLD.MapObjectId.chrystal;

        newChrystal.position.x = parcel.x;
        newChrystal.position.z = parcel.z;

        newChrystal.parcel = parcel;

        /*
        let light = new THREE.PointLight(0xffffff,  1, 200,  2);        
        light.position.y = -100;
        light.castShadow = true;
        newChrystal.add(light);
        */

        let material = new THREE.LineBasicMaterial({ linewidth: 1 });
        material.color.setHSL(Math.random(), 1, 0.9 );

        let geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        geometry.vertices.push(new THREE.Vector3(0, -2000, 0));

        let line = new THREE.Line(geometry, material);
        line.position.y = -50;
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
        console.log(WORLD.parcels);  
    }

}

function createExercise() {

    if (exerciseGroup) {
        scene.remove(exerciseGroup);
    }

    let ops = [];

    if (gameSettings.add) ops.push({ op: OperatorType.Addition, sym: gameSettings.addSym, max: gameSettings.addMax, maxr: gameSettings.addResMax });
    if (gameSettings.sub) ops.push({ op: OperatorType.Substraction, sym: gameSettings.subSym, max: gameSettings.subMax, maxr: gameSettings.subResMax });
    if (gameSettings.multi) ops.push({ op: OperatorType.Multiplication, sym: gameSettings.multiSym, max: gameSettings.multiMax, maxr: gameSettings.multiResMax });
    if (gameSettings.div) ops.push({ op: OperatorType.Division, sym: gameSettings.divSym, max: gameSettings.divMax, maxr: gameSettings.divResMax });

    if (ops.length == 0) {
        ops.push({op: OperatorType.Addition, sym: gameSettings.addSym,  max:10, maxr: 10}); // fallback if nothing selected
    }

    let rnd = Math.floor(Math.random() * (ops.length));
    
    let op = ops[rnd];

    // console.log(op);

    let x = new MathExercise(op.op, op.sym, parseInt(op.max), parseInt(op.maxr), gameSettings.numChoices);

    exerciseGroup = new THREE.Group();
    let xtext = createText(x.description, function(mesh){
        if (tickSound)  mesh.add(tickSound);
    });
    xtext.position.y = 120;
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

function onWindowResize(update = true) {    

    let res = { x: resolutions[gfxSettings.resolution].x, y: resolutions[gfxSettings.resolution].y };

    if (res.x == 0) {
        res.x = window.innerWidth ;
    } 
    if (res.y == 0) {
        res.y = window.innerHeight;
    } 

    res.x = Math.min(res.x, window.innerWidth);
    res.y = Math.min(res.y, window.innerHeight);

    camera.aspect = res.x / res.y;
    camera.updateProjectionMatrix();

    // renderer.setPixelRatio(window.devicePixelRatio * scale);
    let scale = gfxSettings.quality;

    renderer.setSize( res.x / scale, res.y / scale, false );
    renderer.domElement.style.width = renderer.domElement.width * scale + 'px';
    renderer.domElement.style.height = renderer.domElement.height * scale + 'px';

    var style = window.getComputedStyle(renderer.domElement);
    playerInfo.style.marginLeft = style.marginLeft;
    playerInfo.style.marginTop = style.marginTop;
    
    playerInfo.style.fontSize = res.y / (40 - (30 * (1 - res.y / 1200))) + "px"; // non-linear scale for lower res.
    playerInfo.style.lineHeight = playerInfo.style.fontSize;

    miniMap.width = (res.y * 2 + res.x) / (18 - (6 * (1 - res.y / 1200))); // non-linear scale for lower res.
    miniMap.height = miniMap.width;

    miniMapDiv.style.top = res.y / (20 - (15 * (1 - res.y / 1200))) + "px"; // non-linear scale for lower res.
    miniMapDiv.style.marginLeft = style.marginLeft;
    miniMapDiv.style.marginTop = style.marginTop;

    gfxSettings.fullScreen = (window.screen.width == window.innerWidth); // API not working when triggered with F11

    if (update) {
        updateMapData(miniMap, playerGuy.oriY, -playerGuy.position.z / WORLD.parcelSize, playerGuy.position.x / WORLD.parcelSize);  
        render();
    }

    // playerInfo.innerHTML =  window.innerWidth + " x " + window.innerHeight + " (" + window.screen.width + " x " + window.screen.height + ")";
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

    
    if ( gameActive ) {

        requestAnimationFrame( animate );

        //raycaster.ray.origin.copy( controls.getObject().position );
        //raycaster.ray.origin.y -= 10;

        //var intersections = raycaster.intersectObjects( objects );

        //var onObject = intersections.length > 0;

        //var delta = 0.75 * clock.getDelta();

        let delta = clock.getDelta();

        if (gfxSettings.showFPS) {
            if (fps.length > 25) fps.splice(0, 1);
                fps.push(1/delta);
                let currFps = 0;
                for (let idx = 0; idx < fps.length; idx++) {
                    currFps += fps[idx];
            }
            currFps = Math.round(currFps / fps.length);
            playerInfo.innerHTML = currFps + " FPS";
        }

        mixer.update( delta );

        updateControls(delta);

        checkExerciseIntersections();

        render();

        updateCarPositions();
        updateMapData(miniMap, playerGuy.oriY, -playerGuy.position.z / WORLD.parcelSize, playerGuy.position.x / WORLD.parcelSize);

    }
}

function updateCarPositions() {
    if (cars.length > 0)
    {
        for (let car of cars) {
            let parcel = WORLD.parcels[WORLD.getParcelIndex(car.position.x, car.position.z)];
            if (parcel !== car.parcel) {
                if (car.parcel) {
                    car.parcel.mapObjId = WORLD.MapObjectId.road;                    
                }
                car.parcel = parcel;
                parcel.mapObjId = WORLD.MapObjectId.car;
            }
        }
    }
}

function checkChrystals() {
    let foundChrystal;
    let temp = new THREE.Vector3();
    let objPos = controls.getObject().position;//.getWorldPosition();

    for (let chr of chrystals) {

        let chrPos = chr.getWorldPosition(temp);

        // playerInfo.innerHTML = objPos.x + ", " + objPos.z + " -> " + chrPos.x + ", " + chrPos.z;

        if (chrPos.distanceTo( objPos ) < 100 ) {
            foundChrystal = chr;
            // console.log('Christal found!');
            break;
        }
    }
    if (foundChrystal) {
        chrystals.delete(foundChrystal);
        WORLD.model.remove(foundChrystal);

        // remove animations from old instance
        mixer.uncacheRoot(foundChrystal);
        mixer.uncacheRoot(foundChrystal.line);

        let parcel = foundChrystal.parcel;
        parcel.occupied = false;
        WORLD.freeParcels.push[parcel];

        if (collectSound) {
            if (collectSound.isPlaying) collectSound.stop();
            collectSound.play();
        }

        chrystalCount++;

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
        absMaxDistance = WORLD.worldPlates * WORLD.plateSize - guyOffset;
    }
    if (chrystalCount == chrActions.createFences) {
        WORLD.createFences();
    }

    if (chrystalCount >= chrActions.plantsMin) {
        if (ambientSound && !ambientSound.isPlaying) ambientSound.play();
    
        if ( chrystalCount <= chrActions.plantsMax) {
            WORLD.populatePlants(Math.round(5 * (gameSettings.itemAmount/100)), Math.round(10 * (gameSettings.itemAmount/100)), mixer);
        }
    }

    if (chrystalCount == chrActions.prepareRoads) {
        WORLD.prepareRoads();
    }

    if (chrystalCount == chrActions.initRoads) {
        showProgressBar();
        WORLD.initRoads(function (newModel) {
            hideProgressBar();
            // play transition sound
            if (newItemSound && !newItemSound.isPlaying)
                newItemSound.play();                
        }, onProgress, onError);
    }

    if (chrystalCount >= chrActions.carsMin && chrystalCount <= chrActions.carsMax) {
        addCar();
    }

    if (chrystalCount >= chrActions.animalsMin && chrystalCount <= chrActions.animalsMax) {
        addAnimal();
    }

    if (chrystalCount == chrActions.musicSphere) {
        addMusicSphere();
    }
}

function addAnimal() {

    let parcels = [];
    let counter = 0;
    do {
        parcels = [];
        // find empty parcel
        let parcelIdx = Math.floor(Math.random() * (WORLD.freeParcels.length));
        let freeParcel = WORLD.freeParcels[parcelIdx];

        parcels.push(freeParcel);
        
        let parcel = WORLD.parcels[WORLD.getParcelIndex(freeParcel.x, freeParcel.z + WORLD.parcelSize)];
        if (!parcel.occupied) {
            parcels.push(parcel);

            parcel = WORLD.parcels[WORLD.getParcelIndex(freeParcel.x + WORLD.parcelSize, freeParcel.z)];
            if (!parcel.occupied) {
                parcels.push(parcel);

                parcel = WORLD.parcels[WORLD.getParcelIndex(freeParcel.x + WORLD.parcelSize, freeParcel.z + WORLD.parcelSize)];
                if (!parcel.occupied) {
                    parcels.push(parcel);
                }
            }
        }
    } while (parcels.length < 4 && counter++ < 25); // max tries

    if (parcels.length == 4) {

        let x = 0;
        let z = 0;

        for (let parcel of parcels) {
            WORLD.freeParcels.splice(WORLD.freeParcels.indexOf(parcel), 1);
            parcel.occupied = true;
            parcel.mapObjId = WORLD.MapObjectId.animal;
            x += parcel.x;
            z += parcel.z;
        }

        x = x/4;
        z = z/4;

        if (Math.random() < 0.6) {
            initCow(function (cow) {

                WORLD.model.add(cow);

                cow.position.x = x;
                cow.position.z = z;

                cow.rotateY(Math.floor(Math.random() * 4) * Math.PI / 2);

                var action = mixer.clipAction(ANIM.createHeadAnimation( 1, Math.PI/4, 'x'), cow.head);
                action.setLoop(THREE.LoopRepeat).setDuration(5).play();

            }, onProgress, onError);
        } else {
            initHorse(function (horse) {

                WORLD.model.add(horse);
    
                horse.position.x = x;
                horse.position.z = z;
    
                horse.rotateY(Math.floor(Math.random() * 4) * Math.PI / 2);
    
                var action = mixer.clipAction(ANIM.createHeadAnimation( 1, Math.PI/2, 'x'), horse.head);
                action.setLoop(THREE.LoopRepeat).setDuration(5).play();
    
                action = mixer.clipAction(ANIM.createHeadAnimation( 1, -Math.PI * 0.4, 'x'), horse.body);
                action.setLoop(THREE.LoopOnce).setDuration(8).play();
    
            }, onProgress, onError);
        }
    }
}

function addCar() {

    let carIdx = (Math.floor(chrystalCount / 2)) % 2;

    // showProgressBar();
    initCar(carIdx, function (car) {
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

        let motorSound = new THREE.PositionalAudio( listener );
        car.add(motorSound);
        motorSound.setBuffer( motorSoundBuffer );
        motorSound.setRefDistance( 50 );
        motorSound.setLoop( true );
        motorSound.setVolume( 0.7 );
        motorSound.play();
        motorSounds.push(motorSound);

        cars.push(car);

        // hideProgressBar();
    } , onProgress, onError);
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
                    if (tickSound.isPlaying) tickSound.stop();
                    tickSound.play();
                } 
                currentHighlight = intersects[0].object;
            }
        } else {
            currentHighlight = null;
        }

    }
}

const playerCamHeight = 85;
function updateControls(delta) {

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
    direction.z = Number(moveActive[moveDir.forward]) - Number(moveActive[moveDir.backward]);
    direction.x = Number(moveActive[moveDir.right]) - Number(moveActive[moveDir.left]);
    direction.normalize(); // this ensures consistent movements in all directions
    if (moveActive[moveDir.forward] || moveActive[moveDir.backward]) {
        velocity.z -= direction.z * 4000.0 * delta;
    }
    if (moveActive[moveDir.left] || moveActive[moveDir.right])
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

    if (velocity.x != 0 || velocity.z != 0) {
        checkChrystals();
    }

    if (playerGuy) {
        var euler = controls.getObject().rotation.clone();

        if ( lastGuyPos.distanceTo(pos) > 0.1 && playerGuy.walk ) {            
            if ( !playerGuy.isWalking ) playerGuy.walk();
            if ( walkSound && !walkSound.isPlaying ) walkSound.play();
        } else {
            if ( playerGuy.isWalking ) playerGuy.stop();                
        }

        playerGuy.position.x = pos.x;
        playerGuy.position.z = pos.z;
        playerGuy.position.y = pos.y - playerCamHeight;

        euler.reorder("YXZ");
        euler.x = 0;
        euler.z = Math.PI;

        playerGuy.setRotationFromEuler(euler, "YXZ");

        playerGuy.translateZ(guyOffset); 

        playerGuy.oriY = euler.y - Math.PI/2;

        lastGuyPos.copy(pos);
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

/*
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

*/

function updatePlayerInfo() {
    if (playerInfo) {
        playerInfo.innerHTML = playerSettings.name + ": " + chrystalCount + " ("+ chrystals.size +")";
    }
}

/* View in fullscreen */
function openFullscreen() {

    if (document.body.requestFullscreen) {
        document.body.requestFullscreen();
    } else if (document.body.mozRequestFullScreen) { /* Firefox */
        document.body.mozRequestFullScreen();
    } else if (document.body.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        document.body.webkitRequestFullscreen();
    } else if (document.body.msRequestFullscreen) { /* IE/Edge */
        document.body.msRequestFullscreen();
    }
}

/* Close fullscreen */
function closeFullscreen() {
    console.log("Closing FS");
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
      document.msExitFullscreen();
    }
  }

  function toggleFullScreen() {
    var doc = window.document;
    var docEl = doc.body;
  
    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
  
    if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
      requestFullScreen.call(docEl);
    }
    else {
      cancelFullScreen.call(doc);
    }
  }
  