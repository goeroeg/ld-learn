import '../../web_modules/three/build/three.min.js';

// import { GUI } from './node_modules/three/examples/jsm/libs/dat.gui.module.js';
//import { GUI } from '../ld-framework/web_modules/three/examples/jsm/libs/dat.gui.module.js';
import { GUI } from '../../web_modules/dat.gui/build/dat.gui.module.js';
// import { MapControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from '../../web_modules/three/examples/jsm/controls/PointerLockControls.js';

import { MathExercise } from './exercises/Maths.js';
import { OperatorType } from './exercises/Maths.js';
import { GamepadControls } from '../../controls/GamepadControls.js';
import { createText, defaultTextMaterial } from '../../gfx/Text.js';
import { addCrossHair } from '../../controls/CrossHair.js';
import * as WORLD from '../../gfx/World.js';
import * as ANIM from '../../gfx/Animations.js';
import * as OBJS from '../../gfx/Objects.js'
import * as SFX from '../../audio/SoundFX.js';
import * as PTFX from '../../gfx/ParticleEffects.js';
import { initGuy, BodyParts } from '../../gfx/Guy.js';
import { updateMapData, updateMiniMapColors } from '../../gfx/MiniMap.js';
import * as TRAIN from '../../gfx/Train.js';

export var camera, controls, gpControls, scene, renderer, raycaster, intersectedObject, composer;
var particleSystems = [];

//var rayHelper = new THREE.ArrowHelper();

var isElectronApp = (navigator.userAgent.toLowerCase().indexOf(' electron/') > -1); // detect whether run as electron app

var testMode = isElectronApp;

var fps = [];

var mouse = new THREE.Vector2();

var cars = [];
var train = [];

var nightLights = [];

const particleEffects = { rain: null, snow: null, stars: null, shootingStars: null, fireflies: null };

var animClock = new THREE.Clock();
var walkClock = new THREE.Clock();

var playerGuy;
const guyOffset = 20;
var lastGuyPos = new THREE.Vector3();

const jumpInitialVel = 350;

var mixer;

var skyMesh;
var hemiLight;
var dirLight;

const dirLightIntensity = 0.55; //0.45
const hemiLightIntensity = 0.8; // 0.8;

var isNight = false;

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

var isTouch = ('ontouchstart' in window);

var soundBuffers;
var ambientSound;
var rainSound;
// export var windSound;
var sphereSound;
var walkSound;
var tickSound;
var collectSound;
var newItemSound;
var okSounds = [];
var wrongSounds = [];

var resolutions = [{ x: 0, y: 0 }, { x: 320, y: 240 }, {x: 640, y: 480 }, { x: 1024, y: 768 }, { x: 1280, y: 800 }, { x: 1920, y: 1080 }]
var resolutionNames  = { 'Auto': 0, '320x240': 1, '640x480': 2, '1024x768': 3, "1280x800": 4, "1920x1080": 5 };
var qualityNames = { High: 1, Low : 2};
var audioSettings = { enabled : true, volume: 100, ambient : true };
var gamepadSettings = { enabled: true, moveSensitivity: 1, lookSensitivity: 1 };
var gfxSettings = { resolution: resolutionNames.Auto, quality: qualityNames.High, fullScreen: false, shadows: isTouch ? 0 : 3 , antiAlias: true , showFPS: false};
var gameSettings = {
    itemAmount: isTouch ? 20 : 50 , itemEffect: true, nightEnabled: !isTouch, season : WORLD.seasons.auto,
    add : true, addMax : 100, addResMax : 100, addSym: '+',
    sub : true, subMax : 100, subResMax : 100, subSym: '-',
    multi : true, multiMax : 10, multiResMax : 100, multiSym: '·',
    div : false, divMax : 100, divResMax : 10, divSym: ':',
    numChoices : 5 };

const defaultBodyColor = [180, 0, 0];
const defaultLegsColor = [30, 90, 168];

var playerSettings = { name:'Player' }

var gui, playersFolder, gfxFolder, controlsFolder, audioFolder, gameFolder;

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
var weatherIcon = document.getElementById('weatherIcon');
var miniMapDiv = document.getElementById('miniMapDiv');

var touchCamPos = new THREE.Vector2();

const playerCamHeight = 85;

var gameActive = false;

var currentCarRiding = null;

const okColor = 0x00ff00, wrongColor = 0xff0000, selectedEmissive = 0x0000ff;
const fLightsColor = 0xffffff, rLightsColor = 0xff0000, windowColor = 0xffffbb;

var textEmissive = 0x000000;

const chrActions = {
    createPlates : 1,
    createFences : 2,
    createSky : 3,
    plantsMin : 4,
    plantsMax : 20,
    prepareRoads : 18, //18
    initRoads : 19, //19
    carsMin : 20,   //20
    carsMax : 40,   //40
    animalsMin : 12, // 12
    animalsMax : 20, // 20
    musicSphere : 30, // 30
    prepareTracks : 40, // 40
    initTracks : 43, // 43
    trainMin : 44, // 44
    trainMax : 49,  // 49
    nightMod : 10 // 10
}

// main entry point
init();

function init() {
    initScene();
    initControls();
    initSound();
    initGUI();

    createExercise();
}

function initControls() {

    renderer = new THREE.WebGLRenderer( { antialias: gfxSettings.antiAlias } );
    // renderer.setPixelRatio( window.devicePixelRatio );

    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.gammaFactor = 2.2;

    updateShadows(gameSettings.shadow);
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

    let gamePadButtonActions = [];
    gamePadButtonActions[6] = jump;
    gamePadButtonActions[7] = function() {
                                            evaluateAnswer(currentHighlight);
                                         };
    gamePadButtonActions[9] = function() {
                                            if ( controls.isLocked ) {
                                                controls.unlock();
                                            } else if (gameActive) {
                                                pauseGame();
                                            } else {
                                                controls.lock();
                                            }
                                         };
    gamePadButtonActions[16] = gamePadButtonActions[9];

    gpControls.buttonActions = gamePadButtonActions;
    gpControls.moveAction = checkChrystals;

    scene.add( controls.getObject() );

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

        switch ( event.key ) {

            case "ArrowUp": // up
            case "w": // w
            case "Up":
                toggleMove(true, moveDir.forward, touchMoveForward);
                break;

            case "ArrowLeft": // left
            case "a": // a
            case "Left":
            toggleMove(true, moveDir.left, touchMoveLeft);
                break;

            case "ArrowDown": // down
            case "s": // s
            case "Down":
            toggleMove(true, moveDir.backward, touchMoveBack);
                break;

            case "ArrowRight": // right
            case "d": // d
            case "Right":
            toggleMove(true, moveDir.right, touchMoveRight);
                break;

            case " ": // space
            case "Spacebar":
                jump();
                break;

            case "e":
            case "Enter":
                enterOrLeaveCar();
                break;

            case "Backspace": // backspace
                if ( animClock.running ) {
                    animClock.stop();
                } else {
                    animClock.start();
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

function jump() {
    if (canJump === true)
        velocity.y += jumpInitialVel;
    canJump = false;
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
    //e.preventDefault();

    resetTouchControl(touchCameraControls);

    if (currentHighlight) {
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

    pauseSFX();

    animClock.stop();
    walkClock.stop();
    document.removeEventListener('click', onDocumentClick);
    touchCameraControls.removeEventListener('click', onDocumentClick);
}

function startGame() {
    requestAnimationFrame(animate);

    updateBlocker(true);

    document.addEventListener('click', onDocumentClick, false);
    touchCameraControls.addEventListener('click', onDocumentClick, false);

    animClock.start();
    walkClock.start();
    gameActive = true;

    resumeSFX((chrystalCount >= chrActions.plantsMin && audioSettings.ambient), (chrystalCount >= chrActions.musicSphere));
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

function initSound() {

    soundBuffers = {
        ambientDay: { buffer: null, filename: 'ambient_day.ogg' },
        ambientNight: { buffer: null, filename: 'ambient_night.ogg' },
        crows: { buffer: null, filename: 'crows.ogg' },
        magpie: { buffer: null, filename: 'magpie.ogg' },
        silence: { buffer: null, filename: 'silence.ogg' },
        rain: { buffer: null, filename: 'rain.ogg' },
        // wind: { buffer: null, filename: 'wind.ogg' },
        walk: { buffer: null, filename: 'walk.ogg' },
        collect: { buffer: null, filename: 'collect.ogg' },
        newItem: { buffer: null, filename: 'dream.ogg' },
        tick: { buffer: null, filename: 'tick.ogg' },
        motor: { buffer: null, filename: 'motor.ogg' } ,
        train: { buffer: null, filename: 'train_move.ogg' },
        trainEngine: { buffer: null, filename: 'train_engine.ogg' },
        trainHorn: { buffer: null, filename: 'train_horn.ogg' },
        horse: { buffer: null, filename: 'horse.ogg' },
        cow: { buffer: null, filename: 'cow.ogg' },
        sphere: { buffer: null, filename: 'sphere-music.ogg' }
    }

    let callbacks = new Map();

    callbacks.set(soundBuffers.ambientDay, function(buffer, listener) {
        ambientSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(true).setVolume(0.2);
    });

    callbacks.set(soundBuffers.walk, function(buffer, listener) {
        walkSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(false).setVolume(0.2);
    });

    callbacks.set(soundBuffers.collect, function(buffer, listener) {
        collectSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(false).setVolume(0.5);
    });

    callbacks.set(soundBuffers.newItem, function(buffer, listener) {
        newItemSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(false).setVolume(0.3);
    });

    callbacks.set(soundBuffers.tick, function(buffer, listener) {
        tickSound = new THREE.PositionalAudio(listener).setBuffer(buffer).setRefDistance(100).setVolume(0.8);
    });

    callbacks.set(soundBuffers.sphere, function(buffer, listener) {
        sphereSound = new THREE.PositionalAudio(listener).setBuffer(buffer).setLoop(true).setRefDistance(150).setVolume(0.8);
    });

    /*
    callbacks.set(soundBuffers.wind, function(buffer) {
        windSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(true).setVolume(0);
    });
    */

    callbacks.set(soundBuffers.rain, function(buffer, listener) {
        rainSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(true).setVolume(0);
    });


    for (let idx = 1; idx <= 4; idx++)
    {
        let sb = { buffer: null, filename: 'ok_'+ idx +'.ogg' };
        soundBuffers["oksound" + idx] = sb;
        callbacks.set(sb, function(buffer, listener) {
            okSounds.push(new THREE.PositionalAudio(listener).setBuffer(buffer).setRefDistance(100).setVolume(1));
        });
    }

    for (let idx = 1; idx <= 4; idx++)
    {
        let sb = { buffer: null, filename: 'wrong_'+ idx +'.ogg' };
        soundBuffers["wrongsound" + idx] = sb;
        callbacks.set(sb, function(buffer, listener) {
            wrongSounds.push(new THREE.PositionalAudio(listener).setBuffer(buffer).setRefDistance(100).setVolume(1));
        });
    }

    SFX.init(soundBuffers, callbacks, camera);
}

function pauseSFX() {
    if (ambientSound && ambientSound.isPlaying) {
        ambientSound.pause();
    }
    if (sphereSound && sphereSound.isPlaying) {
        sphereSound.pause();
    }
    if (rainSound && rainSound.isPlaying) {
        rainSound.pause();
    }
    /*
    if (windSound && windSound.isPlaying) {
        windSound.pause();
    }
    */

    SFX.pause();
}

export function resumeSFX(ambient, sphere) {
    if (ambient) {
        SFX.play(ambientSound);
    }

    SFX.play(rainSound);
    // play(windSound);


    if (sphere) {
        SFX.play(sphereSound);
    }

    SFX.resume();
}



function initGUI() {

    gui = new GUI( { autoPlace: false } );

    gui.useLocalStorage = true;

    gui.remember(gfxSettings);
    gui.remember(audioSettings);
    gui.remember(gamepadSettings);
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

    onWindowResize(false);


    // does not work when starting fullscreen with F11 :(
    /*
    gfxFolder.add(gfxSettings, "fullScreen").name("Full screen").onChange(function(value) {

        if (value) {
            openFullscreen();
        } else {
            closeFullscreen();
        }

        //toggleFullScreen();
    }).listen();
    */

    gfxFolder.add(gfxSettings, "shadows", 0, 3, 1).name("Shadows").onChange(function(value) {
        // update shadows
        updateShadows(value);
        render();
    });

    updateShadows(gfxSettings.shadows);

    gfxFolder.add(gfxSettings, "showFPS").name("Show FPS").onChange(function(value){
        if (!value) updatePlayerInfo();
    });

    /*
    gfxFolder.add(gfxSettings, "antiAlias").name("Antialias").onChange(function(value) {
        // would need to reset context - so it's a bit complex
    });
    */

    audioFolder = gui.addFolder("Audio settings");
    audioFolder.add(audioSettings, "volume", 0, 100).name("Volume").step(1).onChange(function (value) {
        setMasterVolume();
    });
    audioFolder.add(audioSettings, "enabled").name("Enabled").onChange(function (value) {
        setMasterVolume();
    });
    audioFolder.add(audioSettings, "ambient", 0, 100).name("Ambient sound").onChange(function (value) {
        // noop
    });

    setMasterVolume();

    controlsFolder = gui.addFolder("Gamepad settings");
    controlsFolder.add(gamepadSettings, "enabled").name("Enabled").onChange(setGamepadEnabled);
    controlsFolder.add(gamepadSettings, "moveSensitivity", 0.1, 2).step(0.1).name("Move sensitivity").onChange(function (value) {
        gpControls.moveSensitivity = value;
    });
    controlsFolder.add(gamepadSettings, "lookSensitivity", 0.1, 2).step(0.1).name("Look sensitivity").onChange(function (value) {
        gpControls.lookSensitivity = value;
    });

    gpControls.moveSensitivity = gamepadSettings.moveSensitivity;
    gpControls.lookSensitivity = gamepadSettings.lookSensitivity;
    setGamepadEnabled();

    gameFolder = gui.addFolder("Game settings");
    gameFolder.add(gameSettings, "itemAmount", 10, 200).step(10).name("Obj density %");
    gameFolder.add(gameSettings, "itemEffect").name("Item effects");
    gameFolder.add(gameSettings, "nightEnabled").name("Day/Night cycle").onChange(function (value) {
        let shouldBeNight = value && (Math.floor(chrystalCount / chrActions.nightMod) % 2 != 0);
        if (isNight != shouldBeNight) {
            toggleNight();
            checkAndEndWeatherEffects();
            render();
        }
    });

    gameFolder.add(gameSettings, "season", WORLD.seasons).name("Season").onChange(function (value) {
        setSeason(value);
        render();
        if (playerGuy) {
            updateMapData(miniMap, playerGuy.oriY, -playerGuy.position.z / WORLD.parcelSize, playerGuy.position.x / WORLD.parcelSize);
        }
    });

    setSeason(gameSettings.season);

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

    if (isElectronApp) {
        gui.add(window, "close").name("Exit game");
    }

    // exFolder.open();
    let guiContainer = document.getElementById('guiContainer');
    guiContainer.appendChild(gui.domElement);

    updatePlayerInfo();
}

function setGamepadEnabled() {
    if (gpControls) {
        if (gamepadSettings.enabled && !gpControls.ticking) {
            gpControls.startPolling();
        } else if (gpControls.ticking) {
            gpControls.stopPolling();
        }
    }
}

function setSeason(season) {
    if (season == WORLD.seasons.auto) {
        // determine by date
        var month = new Date().getMonth() + 1;
        if (month <= 2 || month >= 12) season = WORLD.seasons.winter;
        if (month >= 3 && month <= 5) season = WORLD.seasons.spring;
        if (month >= 6 && month <= 8 ) season = WORLD.seasons.summer;
        if (month >= 9 && month <= 11 ) season = WORLD.seasons.autumn;
    }

    WORLD.setSeasonColor(season);

    // adjust lighting a bit
    hemiLight.groundColor.setHex(0xB97A20).lerp(new THREE.Color(WORLD.seasonPlateColor[season].hex), 0.15);

    checkAndEndWeatherEffects();

    updateFog();

    updateMiniMapColors(WORLD.seasonPlateColor[season].hex, WORLD.seasonPlantColor[season].hex);

    updateAmbientSound();
}

function updateShadows(value) {
    renderer.shadowMap.enabled = (value > 0);
    scene.traverse(c => {
        if (c.receiveShadow && c.material) {
            if (c.material.length > 0) {
                for (let mat of c.material) {
                    mat.needsUpdate = true;
                }
            }
            else {
                c.material.needsUpdate = true;
            }
        }
    });
    switch (value) {
        case 1:
            renderer.shadowMap.type = THREE.BasicShadowMap;
            break;
        case 2:
            renderer.shadowMap.type = THREE.PCFShadowMap;
            break;
        case 3:
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            break;
        //case 4 :
        //    renderer.shadowMap.type = THREE.VSMShadowMap;
        //    break;
    }
    renderer.shadowMap.needsUpdate = true;
}

function setMasterVolume() {
    if (SFX.listener) {
        SFX.listener.setMasterVolume(audioSettings.enabled ? audioSettings.volume / 100 : 0);
    }
}

function updateGuyLegsColor(value) {
    if (playerGuy && value) {
        let r = value[0] / 255;
        let g = value[1] / 255;
        let b = value[2] / 255;
        playerGuy.bodyParts.get(BodyParts.Hip).material[0].color.setRGB(r, g, b);
        playerGuy.bodyParts.get(BodyParts.RightLeg).material[0].color.setRGB(r, g, b);
        playerGuy.bodyParts.get(BodyParts.LeftLeg).material[0].color.setRGB(r, g, b);
    }
}

function updateGuyBodyColor(value) {
    if (playerGuy && value) {
        let r = value[0] / 255;
        let g = value[1] / 255;
        let b = value[2] / 255;
        playerGuy.bodyParts.get(BodyParts.Torso).material[0].color.setRGB(r, g, b);
        playerGuy.bodyParts.get(BodyParts.RightArm).material[0].color.setRGB(r, g, b);
        playerGuy.bodyParts.get(BodyParts.LeftArm).material[0].color.setRGB(r, g, b);
    }
}

function initScene() {

    showProgressBar();
    miniMapDiv.style.display = 'none';

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x606060 );

    scene.fog =  new THREE.FogExp2( 0xcccccc, 0.00025);// new THREE.Fog(0xcccccc, 2000, 12000);// .FogExp2( 0xcccccc, 0.0003);

    // world
    //var geometry = new THREE.PlaneGeometry( 200, 200 );
    //geometry.rotateX(Math.PI / 2);

    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0xB97A20;  // brownish orange

    hemiLight = new THREE.HemisphereLight(skyColor, groundColor, hemiLightIntensity);
    scene.add(hemiLight);

    var loader = new THREE.TextureLoader();
    loader.load('../../gfx/textures/sky_day.jpg',
        //loader.load('./gfx/nightsky.jpg',
        texture => {
            var skyGeo = new THREE.SphereBufferGeometry(12 * WORLD.plateSize, 160, 160); //, 0, 2*Math.PI, 0, Math.PI/2);
            var skyMat = new THREE.MeshLambertMaterial({ map: texture, flatShading: true, emissive: 0x5555ff, emissiveIntensity: 0 }); //1
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

    if (WORLD.model) {
        scene.remove(WORLD.model);
    }

    mixer = new THREE.AnimationMixer(scene);

    WORLD.initPlates(function ( newModel ) {
        scene.add(newModel);
        newModel.updateMatrixWorld();

        absMaxDistance = WORLD.worldPlates * WORLD.plateSize - guyOffset;

        WORLD.initScene(function(model) {
                hideProgressBar();
                render();
                updateBlocker(false);
                updateMapData(miniMap, -Math.PI/2, 0, 0);
                miniMapDiv.style.display = '';
        }, onProgress, onError);

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
    dirLight.position.set(0, 11.9 * WORLD.plateSize, 0);
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

    ANIM.blendProperty(mixer, dirLight, 'intensity', dirLightIntensity, 3);

    //let action = mixer.clipAction(ANIM.createHighlightAnimation(1, 1), dirLight);

    let sphereGeo = new THREE.SphereBufferGeometry(250, 32, 32);
    let sphereMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffdd, emissiveIntensity: 1 , roughness: 1});
    let sphere = new THREE.Mesh(sphereGeo, sphereMat);

    sphere.position.copy(dirLight.position);//.normalize().multiplyScalar(11.9 * WORLD.plateSize);
    sphere.attach(dirLight);
    scene.add(sphere);
    skyMesh.attach(sphere);
}

function createSky() {
    walkClock.stop();
    scene.add(skyMesh);

    ANIM.blendProperty(mixer, skyMesh.material, 'emissiveIntensity', 1, 3);

    // lights
    addSun();

    skyMesh.rotateZ(25 * Math.PI/180);

    skyMesh.rotateX(15 * Math.PI/180);
/*
    let action = mixer.clipAction(ANIM.createRotationCcwAnimation(1, 'x'), skyMesh);
    action.setLoop(THREE.LoopRepeat).setDuration(600).play();
*/
    SFX.play(newItemSound);
    walkClock.start();
}

function addMusicSphere() {

    let sphere = OBJS.sphereProto; // .clone(); // re-add if multiple spheres needed
    if (WORLD.freeParcels.length > 0) {

        showProgressBar();

        let parcelIdx = Math.floor(Math.random() * (WORLD.freeParcels.length));

        let parcel = WORLD.freeParcels[parcelIdx];
        WORLD.freeParcels.splice(parcelIdx, 1);

        parcel.occupied = true;
        parcel.mapObjId = WORLD.MapObjectId.msphere;

        sphere.position.x = parcel.x;
        sphere.position.z = parcel.z;

        // WORLD.model.add(sphere);

        let light = new THREE.PointLight(0xffa500,  2, 500,  1.6);

        light.visible = isNight;

        //light.position.x = parcel.x;
        //light.position.z = parcel.z;
        light.position.y = -90;
        // cLight.target = sphere;
        light.castShadow = true;

        //light.attach(sphere);
        sphere.add(light);
        WORLD.model.add(sphere);

        WORLD.addCollBox(sphere);

        nightLights.push(light);

        sphere.add(sphereSound);
        SFX.play(sphereSound);

        addParcelEffect(sphere.position.x, sphere.position.z, 400, 30);

        hideProgressBar();
    }
}

function addParcelEffect(x, z, height, time, size) {
    if (gameSettings.itemEffect) {
        particleSystems.push(PTFX.parcelEffect(scene, x, -z, height, time, size));
    }
}

function addChrystal() {

    let newChrystal = OBJS.chrystalProto.clone();

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

        // todo: dispose geometries
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
        progressBarDiv.style.fontSize = "3em";
        progressBarDiv.style.textShadow = "none";
        progressBarDiv.style.color = "#888";
        progressBarDiv.style.display = "block";
        progressBarDiv.style.position = "absolute";
        progressBarDiv.style.top = "50%";
        progressBarDiv.style.width = "100%";
        progressBarDiv.style.textAlign = "center";
        progressBarDiv.innerText = "Loading...";
    }

    document.body.appendChild( progressBarDiv );

    animClock.stop();
    walkClock.stop();

}

function hideProgressBar() {

    if (document.body.contains(progressBarDiv)) {
        document.body.removeChild( progressBarDiv );
    }

    animClock.start();
    walkClock.start();
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

    if (update && playerGuy) {
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

    if (testMode) {
        addChrystal();
    }

    if (isTouch) {
        let mouseX = ( event.clientX / window.innerWidth ) * 2 - 1;
	    let mouseY = - ( event.clientY / window.innerHeight ) * 2 + 1;

        checkExerciseIntersections( mouseX, mouseY );
    }

    if (currentHighlight) {
        evaluateAnswer(currentHighlight);
    }
}

function evaluateAnswer(obj) {
    if (obj) {
        obj.parent.children[0].material.color.setHex(obj.parent.isResult ? okColor : wrongColor);
        highlightMesh(obj,  (isNight ? (obj.parent.isResult ? okColor : wrongColor) : textEmissive));
        SFX.play(obj.parent.sound, true);

        if (obj.parent.isResult) {
            addChrystal();
        }
        else {

            // show solution
            for (let mesh of exerciseMeshes) {
                if (mesh.parent.isResult) {
                    // window.setTimeout( mesh => {
                        mesh.parent.children[0].material.color.setHex(okColor);
                        highlightMesh(mesh,  isNight ? okColor : textEmissive);
                    // }, 500);
                    break;
                }
            }
        }
        exerciseMeshes = [];
        currentHighlight = null;
        window.setTimeout(createExercise, 1500);
    }
}

function animate() {

    if ( gameActive ) {

        requestAnimationFrame( animate );

        //raycaster.ray.origin.copy( controls.getObject().position );
        //raycaster.ray.origin.y -= 10;

        //var intersections = raycaster.intersectObjects( objects );

        //var onObject = intersections.length > 0;

        //var delta = 0.75 * clock.getDelta();

        let animDelta = animClock.getDelta();
        let walkDelta = walkClock.getDelta();

        if (gfxSettings.showFPS) {
            if (fps.length > 25) fps.splice(0, 1);
                fps.push(1/ Math.max(animDelta, walkDelta));
                let currFps = 0;
                for (let idx = 0; idx < fps.length; idx++) {
                    currFps += fps[idx];
            }
            currFps = Math.round(currFps / fps.length);
            playerInfo.innerHTML = currFps + " FPS";
        }

        mixer.update( animDelta );

        if (currentCarRiding == null) {
            updateControls( walkDelta );
        }

        checkExerciseIntersections(0, 0);

        particleSystems = particleSystems.filter(function(ps) {
            ps.update(animDelta);
            return !ps.removeAndDisposeIfFinished();
        });

        render();

        updateVehiclePositions();

        if (currentCarRiding != null) {
            updateMapData(miniMap, -currentCarRiding.rotation.y + Math.PI/2, currentCarRiding.position.z / WORLD.parcelSize, currentCarRiding.position.x / WORLD.parcelSize);
        }
        else {
            updateMapData(miniMap, playerGuy.oriY, -playerGuy.position.z / WORLD.parcelSize, playerGuy.position.x / WORLD.parcelSize);
        }

       /* if (!walkClock.running && !document.body.contains(progressBarDiv)) {
            walkClock.start();
        }*/
    }
}

function updateVehiclePositions() {
    if (cars.length > 0)
    {
        for (let car of cars) {
            updateVehiclePos(car, WORLD.MapObjectId.car, WORLD.MapObjectId.road);

            let velVec = car.getWorldDirection(new THREE.Vector3());
            car.frontBbox.copy(car.bbox).translate(velVec.multiplyScalar(-120)).expandByScalar(-30);
        }
        for (let car of cars) {
            if (car.anims && car.anims.length > 0) {
                let brake = (currentCarRiding == null) && car.frontBbox.intersectsBox(new THREE.Box3().setFromObject(playerGuy));
                if (!brake) {
                    for (let c of cars) {
                        if (c !== car) {
                            if (car.frontBbox.intersectsBox(c.bbox)) {
                                if (c.waitFor !== car) { // resolve deadlocks
                                    car.waitFor = c;
                                    brake = true;
                                }
                                break;
                            }
                        }
                    }
                }

                if (brake) {
                    car.braking = true;
                    for (let anim of car.anims) {
                        anim.halt(0.1);
                    }
                }
                else {
                    if (car.braking) {
                        car.braking = false;
                        for (let anim of car.anims) {
                            anim.setDuration(anim.duration);
                            anim.paused = false;
                        }
                    }
                    car.waitFor = null;
                }
            }
        }
    }

    if (train.length > 0) {
        for (let waggon of train) {
            updateVehiclePos(waggon, WORLD.MapObjectId.train, WORLD.MapObjectId.none);
        }
    }

    function updateVehiclePos(vehicle, mapId, altMapId) {
        let parcel = WORLD.parcels[WORLD.getParcelIndex(vehicle.position.x, vehicle.position.z)];
        if (parcel !== vehicle.parcel) {
            if (vehicle.parcel) {
                vehicle.parcel.mapObjId = altMapId;
            }
            vehicle.parcel = parcel;
            parcel.mapObjId = mapId;
        }
        if (vehicle.bbox) {
            vehicle.bbox.setFromObject(vehicle);
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

        SFX.play(collectSound, true);

        chrystalCount++;

        // update display
        updatePlayerInfo();

        // actions
        performChrystalAction();
    }
}

function performChrystalAction() {

    // walkClock.stop();
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
        if (chrystalCount == chrActions.plantsMin) {
            if (audioSettings.ambient) {
                updateAmbientSound();
                SFX.play(ambientSound);
            }
        }

        if ( chrystalCount <= chrActions.plantsMax) {
            WORLD.populatePlants(Math.round(2 * (gameSettings.itemAmount/100)), Math.round(5 * (gameSettings.itemAmount/100)), mixer, addParcelEffect);
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
            SFX.play(newItemSound);
        }, onProgress, onError, addParcelEffect);
    }

    if (chrystalCount >= chrActions.carsMin && !isNight && (cars.length <= chrActions.carsMax - chrActions.carsMin)) {
        // adding cars at night stops too long due to shader recompiling...
        addCar();
    }

    if (chrystalCount >= chrActions.animalsMin && chrystalCount <= chrActions.animalsMax) {
        addAnimal();
    }

    if (chrystalCount == chrActions.musicSphere) {
        addMusicSphere();
    }

    if (chrystalCount == chrActions.prepareTracks) {
        TRAIN.prepareTracks(mixer);
    }

    if (chrystalCount == chrActions.initTracks) {
        showProgressBar();
        TRAIN.initTracks(function (track) {
            hideProgressBar();
        } , onProgress, onError, addParcelEffect);
    }

    if (chrystalCount == chrActions.trainMin) {
        initLoco();
    }

    if (chrystalCount > chrActions.trainMin && chrystalCount <= chrActions.trainMax) {
        addWaggon(chrystalCount == chrActions.trainMax);
    }

    if ((chrystalCount % chrActions.nightMod) == 0) {
        toggleNight();
    }

    if (chrystalCount > chrActions.createSky) {
        toggleWeatherEffects();
    }
    //walkClock.start();
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
            // parcel.occupied = true;
            parcel.mapObjId = WORLD.MapObjectId.animal;
            x += parcel.x;
            z += parcel.z;
        }

        x = x/4;
        z = z/4;

        if (Math.random() < 0.6) {
            OBJS.initCow(function (cow) {

                WORLD.model.add(cow);
                for (let parcel of parcels) {
                    parcel.occupied = cow;
                }

                cow.position.x = x;
                cow.position.z = z;

                cow.rotateY(Math.floor(Math.random() * 4) * Math.PI / 2);

                var action = mixer.clipAction(ANIM.createHeadAnimation( 1, Math.PI/4, 'x'), cow.head);
                action.setLoop(THREE.LoopRepeat).setDuration(5).play();

                SFX.addItemSound(cow, soundBuffers.cow, true);

                WORLD.addCollBox(cow);

            }, onProgress, onError);
        } else {
            OBJS.initHorse(function (horse) {

                WORLD.model.add(horse);

                for (let parcel of parcels) {
                    parcel.occupied = horse;
                }

                horse.position.x = x;
                horse.position.z = z;

                horse.rotateY(Math.floor(Math.random() * 4) * Math.PI / 2);

                var action = mixer.clipAction(ANIM.createHeadAnimation( 1, Math.PI/2, 'x'), horse.head);
                action.setLoop(THREE.LoopRepeat).setDuration(5).play();

                action = mixer.clipAction(ANIM.createHeadAnimation( 1, -Math.PI * 0.4, 'x'), horse.body);
                action.setLoop(THREE.LoopOnce).setDuration(8).play();

                SFX.addItemSound(horse, soundBuffers.horse, true);

                WORLD.addCollBox(horse);
            }, onProgress, onError);
        }
    }
}

function initLoco() {
    showProgressBar();
    TRAIN.initLoco(function (loco) {


        for (let mesh of loco.rearLights) {
            addRearLight(mesh);
        }

        for (let mesh of loco.frontLights) {
            addFrontLight(mesh);
        }

        for (let mesh of loco.windows) {
            if (isNight) {
                mesh.material[0].emissive.setHex(windowColor);
            }
            mesh.material[0].emissiveIntensity = 0.6;
        }

        let clip = ANIM.createTrackAnimation(TRAIN.linTrackNumber, TRAIN.trackHalfLength * 2, TRAIN.trackCurveRadius, TRAIN.vehicleLength * train.length);
        var action = mixer.clipAction(clip, loco);
        let duration =  0.005 * clip.path.getLength();

        action.setLoop(THREE.LoopRepeat).setDuration(duration);

        if (train.length > 0) {
            action.syncWith(train[0].anim);
        }

        action.play();

        loco.anim = action;

        WORLD.model.add(loco);

        hideProgressBar();

        SFX.addItemSound(loco, soundBuffers.trainEngine, true);
        SFX.addItemSound(loco, soundBuffers.train, true);
        SFX.addItemSound(loco, soundBuffers.trainHorn, true).setVolume( 10 );

        train.push(loco);
    }, onProgress, onError);
}

function addFrontLight(mesh) {
    let light = new THREE.SpotLight(fLightsColor, 1, 800, 30 * Math.PI / 180, 0.4, 1.2);
    // light.add(new THREE.AxesHelper(50));
    mesh.parent.add(light);
    mesh.parent.add(light.target);

    light.translateY(-8);
    light.target.translateY(-100);
    light.target.translateZ(-20);

    // light.castShadow = true;
    light.visible = isNight;
    nightLights.push(light);

    if (isNight) {
        mesh.material[0].emissive.setHex(fLightsColor);
    }
    mesh.material[0].emissiveIntensity = 2;
}

function addRearLight(mesh) {
    let light = new THREE.SpotLight(rLightsColor, 1, 300, 75 * Math.PI / 180, 0.8, 1.4);
    // light.add(new THREE.AxesHelper(50));
    mesh.parent.add(light);
    mesh.parent.add(light.target);

    light.translateY(-8);
    light.target.translateY(-100);

    // light.castShadow = true;
    light.visible = isNight;
    nightLights.push(light);

    if (isNight) {
        mesh.material[0].emissive.setHex(rLightsColor);
    }
}

function addWaggon(isLast) {
    showProgressBar();
    TRAIN.initWaggon(function (waggon) {
        // waggon.translateX(vehicleLength * (chrystalCount - chrActions.trainMin));

        // console.log(waggon);

        waggon.frontLights = [];

        if (isLast) {
            for (let mesh of waggon.rearLights) {
                addRearLight(mesh);
            }
        } else {
            waggon.rearLights = [];
        }

        for (let mesh of waggon.windows) {
            if (isNight) {
                mesh.material[0].emissive.setHex(windowColor);
            }
            mesh.material[0].emissiveIntensity = 0.6;
        }

        let clip = ANIM.createTrackAnimation(TRAIN.linTrackNumber, TRAIN.trackHalfLength * 2, TRAIN.trackCurveRadius, TRAIN.vehicleLength * train.length);
        var action = mixer.clipAction(clip, waggon);
        let duration =  0.005 * clip.path.getLength();

        action.setLoop(THREE.LoopRepeat).setDuration(duration);

        if (train.length > 0) {
            action.syncWith(train[0].anim);
        }
        action.play();

        waggon.anim = action;

        SFX.addItemSound(waggon, soundBuffers.train, true, 1.5);

        train.push(waggon);

        WORLD.model.add(waggon);
        hideProgressBar();
    }, onProgress, onError, isLast);
}

function addCar() {

    let carIdx = (Math.floor(chrystalCount / 2)) % (OBJS.availableCarModels);

    showProgressBar();
    OBJS.initCar(carIdx, function (car) {

        for (let mesh of car.rLights) {
            addRearLight(mesh);
        }

        for (let mesh of car.fLights) {
            addFrontLight(mesh);
        }

        let roadCenterFactor = 0.32; // 0.28

        let ccw = (chrystalCount % 2 == 0); // every second counter-clockwise
        let clip = ANIM.createRoadAnimation((WORLD.roadPlates * 2) + (roadCenterFactor * (ccw ? 1 : -1)), WORLD.plateSize, WORLD.plateSize / 2 * (1 + roadCenterFactor * (ccw ? 1 : -1)) , ccw, 80);
        var action = mixer.clipAction(clip, car);

        action.duration =  0.0025 * clip.path.getLength();
        action.setLoop(THREE.LoopRepeat).setDuration(action.duration).play();

        car.anims = [];
        car.anims.push(action);

        for (let wheel of car.rWheels) {
            action = mixer.clipAction(ANIM.createRotationAnimation(1, 'z'), wheel);
            action.duration = 0.75;
            action.setLoop(THREE.LoopRepeat).setDuration(action.duration).play();
            car.anims.push(action);
        }
        for (let wheel of car.lWheels) {
            action = mixer.clipAction(ANIM.createRotationCcwAnimation(1, 'z'), wheel);
            action.duration = 0.75;
            action.setLoop(THREE.LoopRepeat).setDuration(action.duration).play();
            car.anims.push(action);
        }

        WORLD.model.add(car);

        hideProgressBar();

        WORLD.addCollBox(car);

        car.frontBbox = new THREE.Box3();
        //scene.add(new THREE.Box3Helper(car.frontBbox, new THREE.Color("red")));

        SFX.addItemSound(car, soundBuffers.motor, true);

        cars.push(car);


    } , onProgress, onError);
}

function checkExerciseIntersections(mouseX, mouseY) {
    if (exerciseMeshes.length > 0) {
        for (let mesh of exerciseMeshes) {
            highlightMesh(mesh, textEmissive);
        }

        exerciseGroup.lookAt(controls.getObject().getWorldPosition(new THREE.Vector3()));

        raycaster.setFromCamera({ x: mouseX, y: mouseY }, camera);
        var intersects = raycaster.intersectObjects(exerciseMeshes);
        if (intersects.length > 0) {
            highlightMesh(intersects[0].object, selectedEmissive);
            if (intersects[0].object != currentHighlight)
            {
                SFX.play(tickSound, true);
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

    let oldPos = controls.getObject().position;
    oldPos = new THREE.Vector3(oldPos.x, oldPos.y, oldPos.z);

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
        let testPos = new THREE.Vector3();
        controls.getObject().getWorldPosition(testPos);
        testPos.y -= playerCamHeight / 2;

        // let collArr = Array.from(WORLD.collObjs); fix if problems with set
        for (let bbox of WORLD.collObjs) {
            if (bbox.containsPoint(testPos)) {
                testPos = new THREE.Vector3(testPos.x, testPos.y, oldPos.z);
                if (bbox.containsPoint (testPos)) { // enable sliding to one side
                    pos.x = oldPos.x;
                } else {
                    pos.z = oldPos.z;
                }
                break;
            }
        }

        checkChrystals();
    }

    if (playerGuy) {
        if ( lastGuyPos.distanceTo(pos) > 0.1 && playerGuy.walk ) {
            if ( !playerGuy.isWalking ) playerGuy.walk();
            SFX.play(walkSound);
        } else {
            if ( playerGuy.isWalking ) playerGuy.stop();
        }

        let euler = getXZNormalizedEuler(controls.getObject());

        playerGuy.position.x = pos.x;
        playerGuy.position.z = pos.z;
        playerGuy.position.y = pos.y - playerCamHeight;

        playerGuy.setRotationFromEuler(euler, "YXZ");

        playerGuy.translateZ(guyOffset);

        playerGuy.oriY = euler.y - Math.PI/2;

        lastGuyPos.copy(pos);
    }
}

function getXZNormalizedEuler(object) {
    let euler = object.rotation.clone();
    euler.reorder("YXZ");
    euler.x = 0;
    euler.z = Math.PI;
    return euler;
}

function toggleNight() {
    if (gameSettings.nightEnabled || isNight) {

        let nightChangeDuration = 1;

        isNight = !isNight;

        updateFog();

        if (dirLight) {

            // ANIM.blendColor(mixer, dirLight, isNight ? 0x222244 : 0xffffff, nightChangeDuration);
            dirLight.color.setHex(isNight ? 0x222244 : 0xffffff)
        }

        if (hemiLight) {
            ANIM.blendProperty(mixer, hemiLight, 'intensity', (isNight ? 0.075 : hemiLightIntensity), nightChangeDuration);
            // hemiLight.intensity = (isNight ? 0.075 : 0.8);// (isNight ? 0.15 : 0.8);
        }

        if (skyMesh) {
            ANIM.blendProperty(mixer, skyMesh.material, 'emissiveIntensity', (isNight ? 0.05 : 1), nightChangeDuration);
            // skyMesh.material.emissiveIntensity = (isNight ? 0.05 : 1);// (isNight ? 0.1 : 1);
        }

        for (let light of nightLights) {
            light.visible = isNight;
        }

        for (let car of cars) {
            for (let light of car.fLights) {
                light.material[0].emissive.setHex(isNight ? fLightsColor : 0x000000);
            }
            for (let light of car.rLights) {
                light.material[0].emissive.setHex(isNight ? rLightsColor : 0x000000);
            }
        }

        for (let vehicle of train) {
            if (vehicle.frontLights) {
                for (let light of vehicle.frontLights) {
                    light.material[0].emissive.setHex(isNight ? fLightsColor : 0x000000);
                }
            }
            if (vehicle.rearLights) {
                for (let light of vehicle.rearLights) {
                    light.material[0].emissive.setHex(isNight ? rLightsColor : 0x000000);
                }
            }

            for (let mesh of vehicle.windows) {
                mesh.material[0].emissive.setHex(isNight ? windowColor : 0x000000);
            }
        }

        playerInfo.style.color = (isNight ? "gold" : "black");

        textEmissive = isNight ? 0x888866 : 0x000000;
        defaultTextMaterial.emissive.setHex(textEmissive);

        exerciseGroup.traverse(function (obj) {
            if (obj.isMesh) {
                highlightMesh(obj, textEmissive);
            }
        });

        updateAmbientSound();
    }
}

function updateAmbientSound() {
    let sb;

    if (WORLD.currentSeason == WORLD.seasons.winter) {
        sb = isNight ? soundBuffers.silence : soundBuffers.crows;
    } else if (WORLD.currentSeason == WORLD.seasons.autumn) {
        sb = isNight ? soundBuffers.ambientNight : soundBuffers.magpie;
    } else {
        sb = isNight ? soundBuffers.ambientNight : soundBuffers.ambientDay;
    }

    if (ambientSound) {
        ambientSound.setBuffer(sb.buffer);

        if (ambientSound.isPlaying) {
            ambientSound.pause();
            if (audioSettings.ambient) {
                ambientSound.play();
            }
        }
    }
}


function checkAndEndWeatherEffects(ttl = 0, all = false, removeStars = true) {

    if (!isNight || all) {
        if (particleEffects.stars) {
            //console.log("- stars" + removeStars ? " (remove)" : " (leave)")
            particleEffects.stars.ttl = ttl;
            particleEffects.stars = null;
        }
        if (particleEffects.shootingStars) {
            //console.log("- sstars")
            particleEffects.shootingStars.ttl = ttl;
            particleEffects.shootingStars = null;
        }
        if (particleEffects.fireflies) {
            //console.log("- fireflies")
            particleEffects.fireflies.ttl = ttl;
            particleEffects.fireflies = null;
        }
    } else {
        if (!(particleEffects.snow || particleEffects.rain || particleEffects.stars)) {
            //console.log("Stars " + intensity);
            particleEffects.stars = PTFX.starsAbove(scene);
            particleSystems.push(particleEffects.stars);
        }
    }

    if (particleEffects.snow && (WORLD.currentSeason == WORLD.seasons.summer || all)) {
        //console.log("- snow")
        particleEffects.snow.ttl = ttl;
        particleEffects.snow = null;
    }

    if (all && particleEffects.rain) {
        //console.log("- rain")
        particleEffects.rain.ttl = ttl;
        particleEffects.rain = null;

        SFX.setVolume(rainSound, 0, ttl + 2);
    }

    if (removeStars) {
        for (let ps of particleSystems) {
            if (ps.type == PTFX.ptfxType.stars || ps.type == PTFX.ptfxType.sstars) {
                if (!isNight) {
                    ps.removeSelf();
                } else {
                    ps.update(PTFX.starsTtl);
                }
            }
        }
    }
}

function toggleWeatherEffects() {

    let precipVal = Math.random();
    let precip = precipVal < 0.33 || (precipVal < 0.66 && (WORLD.currentSeason == WORLD.seasons.spring || WORLD.currentSeason == WORLD.seasons.autumn));

    let intensity = Math.round(Math.random() * 18 + 2) / 10;

    checkAndEndWeatherEffects(3, true, precip || (!isNight));

    let wIconPath = '../../gfx/textures/weather/w_' + (isNight ? 'night' : 'day');

    if (precip) {

        if (intensity < 0.8) {
            wIconPath += '_light';
        } else if (intensity > 1.2) {
            wIconPath += '_heavy';
        }

        if (WORLD.currentSeason != WORLD.seasons.summer &&
            ((WORLD.currentSeason == WORLD.seasons.winter && Math.random() < 0.85)
                || (intensity < 1 && Math.random() < 0.2))) {
            //snow
            //console.log("Snow " + intensity);
            particleEffects.snow = PTFX.letItSnow(scene, intensity, PTFX.generateWind(150));
            particleSystems.push(particleEffects.snow);
            wIconPath += '_snow';

        } else {
            // rain
            //console.log("Rain " + intensity);
            particleEffects.rain = PTFX.letItRain(scene, intensity, PTFX.generateWind(500));
            particleSystems.push(particleEffects.rain);

            SFX.setVolume(rainSound, intensity * 0.75, 5);

            wIconPath += '_rain';
        }

    } else if (isNight) {
        // stars
        //console.log("Stars " + intensity);
        particleEffects.stars = PTFX.starsAbove(scene, intensity);
        particleSystems.push(particleEffects.stars);

        if ((WORLD.currentSeason == WORLD.seasons.summer || WORLD.currentSeason == WORLD.seasons.spring) && Math.random() < 0.33) {
            // fireflies
            //console.log("Fireflies " + intensity);
            intensity = Math.round(Math.random() * 18 + 2) / 10;
            particleEffects.fireflies = PTFX.fireflies(scene, intensity);
            particleSystems.push(particleEffects.fireflies);

            wIconPath += '_ff';
        }

        if (WORLD.currentSeason != WORLD.seasons.winter && Math.random() < 0.33) {
            // shooting stars
            //console.log("SStars " + intensity);
            particleEffects.shootingStars = PTFX.shootingStars(scene, intensity);
            particleSystems.push(particleEffects.shootingStars);
            wIconPath += '_sstar';
        }
    }

    weatherIcon.src = wIconPath + '.png';

    ANIM.blendProperty(mixer, dirLight, 'intensity', precip ? 0.05 : dirLightIntensity, 3);

    updateFog();
}

function updateFog() {
    if (scene && scene.fog) {

        scene.fog.color.setHex(isNight ? 0x101015 : 0xcccccc);

        let newDensity = scene.fog.density;
        let precip = (particleEffects.rain || particleEffects.snow);

        let season = WORLD.currentSeason;
        if (season == WORLD.seasons.winter) {
            newDensity = precip ? 0.0004 : 0.00016;
        } else if (season == WORLD.seasons.autumn) {
            newDensity =  precip ? 0.0003 : 0.00014;
        } else {
            newDensity = precip ? 0.00025 : 0.00012;
        }

        ANIM.blendProperty(mixer, scene.fog, "density", newDensity, 3);
    }
}

function highlightMesh(mesh, colorHex) {
    mesh.parent.children[0].material.emissive.setHex(colorHex);
}

function render() {
    // checkIntersect();
    renderer.render( scene, camera );
}

function updatePlayerInfo() {
    if (playerInfo) {
        playerInfo.innerHTML = playerSettings.name + ": " + chrystalCount + " ("+ chrystals.size +")";
    }
}

function enterOrLeaveCar() {
    if ((currentCarRiding == null) && cars.length > 0) {

        let car;
        let minDist = 45000;
        let cam = controls.getObject();

        for (let c of cars) { // z direction of cam and car is opposed
            let dist = (c.position.x - cam.position.x) * (c.position.x - cam.position.x) + (c.position.z + cam.position.z) * (c.position.z + cam.position.z);
            if (dist < minDist) {
                car = c;
                minDist = dist;
            }
        }

        if (car) {
            cam.position.x = 0;
            cam.position.z = 0;
            cam.position.y = 0;

            cam.rotation.x = 0;
            cam.rotation.y = Math.PI;
            cam.rotation.z = 0;

            if (!car.camGroup) {
                let camGroup = new THREE.Group();
                camGroup.translateZ(-5);
                camGroup.rotateX(Math.PI);
                camGroup.translateY(-9);
                car.figHead[0].add(camGroup);
                car.attach(camGroup);
                car.camGroup = camGroup;

                car.figHead[0].origParent = car.figHead[0].parent;
                car.figHead[0].origPos = car.figHead[0].position.clone();
                car.figHead[0].origRot = car.figHead[0].rotation.clone();
            }

            car.camGroup.add(cam);
            cam.attach(car.figHead[0]);

            scene.remove(playerGuy);
            currentCarRiding = car;
        }
    } else if (currentCarRiding != null) {

        currentCarRiding.figHead[0].position.copy(currentCarRiding.figHead[0].origPos);
        currentCarRiding.figHead[0].rotation.copy(currentCarRiding.figHead[0].origRot);
        currentCarRiding.figHead[0].origParent.add(currentCarRiding.figHead[0]);

        let cam = controls.getObject();
        scene.attach(cam);

        cam.position.y = playerCamHeight;
        cam.setRotationFromEuler(new THREE.Euler(0, Math.PI - currentCarRiding.rotation.y, 0, "XYZ"));

        velocity.y += jumpInitialVel;

        scene.add (playerGuy);

        currentCarRiding = null;
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

