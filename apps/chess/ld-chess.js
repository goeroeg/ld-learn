import '../../web_modules/three/build/three.min.js';

// import { GUI } from './node_modules/three/examples/jsm/libs/dat.gui.module.js';
//import { GUI } from '../ld-framework/web_modules/three/examples/jsm/libs/dat.gui.module.js';
import { GUI as DatGUI } from '../../web_modules/dat.gui/build/dat.gui.module.js';
import { OrbitControls } from '../../web_modules/three/examples/jsm/controls/OrbitControls.js';

import * as ANIM from '../../gfx/Animations.js';

import * as CHESS from '../../web_modules/js-chess-engine/lib/js-chess-engine.mjs'

import * as OBJS from './chess_obj.js'

import * as PTFX from '../../gfx/ParticleEffects.js';

import * as GUI from '../../gui/guiutils.js'

import { ldrawColors } from '../../gfx/LDrawHelper.js';

var camera, mapControls, scene, renderer, raycaster;


const playerLevels = {
    aiVeryEasy : 0,
    aiEasy : 1,
    aiNormal : 2,
    aiHard : 3,
    aiExpert: 4,
    human: 5
}

//var rayHelper = new THREE.ArrowHelper();

var isElectronApp = (navigator.userAgent.toLowerCase().indexOf(' electron/') > -1); // detect whether run as electron app

var testMode = isElectronApp;

var fps = [];
var skipFrame = false;

var mouse = new THREE.Vector2();

var animClock = new THREE.Clock();

var mixer;

var currentHighlight;

var progressBarDiv;

var isTouch = ('ontouchstart' in window);

var resolutions = [{ x: 0, y: 0 }, { x: 320, y: 240 }, {x: 640, y: 480 }, { x: 1024, y: 768 }, { x: 1280, y: 800 }, { x: 1920, y: 1080 }]
var resolutionNames  = { 'Auto': 0, '320x240': 1, '640x480': 2, '1024x768': 3, "1280x800": 4, "1920x1080": 5 };
var qualityNames = { High: 1, Low : 2};
var audioSettings = { enabled : true, volume: 100, ambient : true };
var gfxSettings = { resolution: resolutionNames.Auto, quality: qualityNames.High, fullScreen: false, shadows: isTouch ? 0 : 3 , antiAlias: true , showFPS: true};
var gameSettings = { white: playerLevels.human, black: playerLevels.aiEasy };

var playerSettings = { name:'Player' }

var gui, gfxFolder, audioFolder, gameFolder;

const playerInfo = document.getElementById('playerInfo');
const blocker = document.getElementById( 'blocker' );
const instructions = document.getElementById( 'instructions' );
const clickSpan = document.getElementById( 'clickSpan' );
const settings = document.getElementById( 'settings' );

const restartGameControl = document.getElementById('restartGame');
const undoMoveControl = document.getElementById('undoMove');
const showHintControl = document.getElementById('showHint');
const fullScreenControl = document.getElementById('fullScreen');
const showSettingsControl = document.getElementById('showSettings');
const exitToMenuControl = document.getElementById('exitToMenu');
const toggleAudioControl = document.getElementById('toggleAudio');

const confirmRestartDialog = document.getElementById('confirmDialog');

var fromCell, toCell;

var intersectMeshes = new Set();
var highlightedSelectableCells = [];
var highlightedPossibleCells = [];
var highlightedHintCells = [];

var touchCamPos = new THREE.Vector2();

var dirLight;

var gameActive = false;
var undoPossible = false;

const noEmissive = 0x000000, possibleEmissive = 0x003300, dangerEmissive = 0x660000, selectedEmissive = 0x000066, selectableEmissive = 0x003333, hintEmissive = 0x660066;
const noColor = 0x000000, possibleColor = 0x00ff00, dangerColor = 0xff0000, selectedColor = 0x0000ff, selectableColor = 0x00ffff, hintColor = 0xff00ff;
const possibleMat = new Set(), dangerMat = new Set(), selectedMat = new Set(), selectableMat = new Set(), hintMat = new Set();
const highlightDuration = 0.15, moveDuration = 0.2;

var game, status, lastCastling = {};

// main entry point
init();

function init() {

    initScene();
    initControls();
    // initSound();
    // initDatGUI();
    initGUI();
    // createExercise();
}

function initGUI() {
    fullScreenControl.addEventListener('click', toggleFullScreen);
    GUI.setDisabled(fullScreenControl, false);

    exitToMenuControl.addEventListener('click', function(e) {
        if (gameActive) {
            pauseGame();
        }
    });

    const okButton = confirmRestartDialog.querySelector('#ok');
    const cancelButton = confirmRestartDialog.querySelector('#cancel');

    okButton.addEventListener('click', function(e) {
        resetPlayerHints();
        initGame();
        confirmRestartDialog.close();
    });

    cancelButton.addEventListener('click', function(e) {
        confirmRestartDialog.close();
    });

    confirmRestartDialog.addEventListener('close', function(e) {
        startGame(false);
    });

    restartGameControl.addEventListener('click', function(e) {
        tryRestartGame();
    });


    undoMoveControl.addEventListener('click', function(e) {
        if (undoPossible) {
            undoMove();
        }
    });

    showHintControl.addEventListener('click', function(e) {
        if (!showHintControl.classList.contains('disabled')) {
            showAIMoveHint();
        }
    });

    if (isTouch) {
        instructions.addEventListener( 'touchstart', function (e) {
            GUI.openFullscreen();
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
        instructions.querySelector('a').addEventListener('click', function(e) {
            e.stopPropagation();
        });
        instructions.addEventListener( 'click', function (e) {
            startGame();
        });
    }

    window.addEventListener('keydown', onWindowKeypress, false);
    window.addEventListener('resize', onWindowResize, false);
}

function tryRestartGame() {
    pauseGame(false);
    confirmRestartDialog.showModal();
}

function onWindowKeypress(e) {
    switch (e.which) {
        case 27: //ESC
            if (isUserFullscreen()) {
                setFullScreenControl(true);
            } else if (gameActive){
                pauseGame();
            }
            break;
        case 122: // F11
            toggleFullScreenControl();
            break;
        case 90: // Z
            if (e.ctrlKey && undoPossible) {
                undoMove();
            }
        default:
            // console.log(e);
            break;
    }
}

function initControls() {

    renderer = new THREE.WebGLRenderer( { antialias: gfxSettings.antiAlias, powerPreference: 'high-performance' } );
    // renderer.setPixelRatio( window.devicePixelRatio );

    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.gammaFactor = 2.2;

    updateShadows(gfxSettings.shadows);
    // renderer.physicallyCorrectLights = true;

    renderer.domElement.setAttribute('style', "position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; margin: auto");
    document.body.insertBefore( renderer.domElement, document.getElementById( 'blocker' ));

    // document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 3500 );

    // camera.up = new THREE.Vector3(0, 0, 1);
    // camera.position.set(WORLD.plateSize, 85, WORLD.plateSize );
    camera.position.set(0, 750, 750);

    /*
    camera.add(dirLight);
    scene.add (camera);
    camera.add (new THREE.CameraHelper(dirLight.shadow.camera));
*/

    raycaster = new THREE.Raycaster();

    mapControls = new OrbitControls(camera, document.body); // new MapControls ( camera, document.body )

    mapControls.screenSpacePanning = false;

    mapControls.minDistance = 200;
    mapControls.maxDistance = 2000;
    mapControls.maxPolarAngle = 88 * Math.PI / 180;

    mapControls.enableDamping = true;

    mapControls.enabled = false;
}

function pauseGame(blocker = true) {
    gameActive = false;

    updateGUIControls();

    if (blocker) {
        updateBlocker(false);
    }

    //pauseSFX();

    animClock.stop();
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener( 'mousemove', onDocumentMouseMove);
}

function updateGUIControls() {
    mapControls.enabled = gameActive;

    GUI.setDisabled(exitToMenuControl, !gameActive);
    GUI.setDisabled(restartGameControl, !gameActive);
    GUI.setDisabled(undoMoveControl,  !(gameActive && undoPossible));
    GUI.setDisabled(showHintControl, !(gameActive && gameSettings[status.turn] == playerLevels.human));
}

function startGame(blocker = true) {
    requestAnimationFrame(animate);
    if (blocker) {
        updateBlocker(true);
    }

    document.addEventListener('click', onDocumentClick, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false );

    animClock.start();

    gameActive = true;

    // resumeSFX((chrystalCount >= chrActions.plantsMin) && audioSettings.ambient, (chrystalCount >= chrActions.musicSphere));

    updateGUIControls();
}

function updateBlocker(hide) {
    if (hide) {
        instructions.style.display = 'none';
        blocker.style.display = 'none';

        //settings.style.display = 'block';
    } else {
        blocker.style.display = 'block';
        instructions.style.display = '';

        //settings.style.display = 'none';
    }
}

function initDatGUI() {

    gui = new DatGUI( { autoPlace: false } );

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
    audioFolder.add(audioSettings, "enabled").name("Enabled").onChange(function (value) {
        setMasterVolume();
    });
    audioFolder.add(audioSettings, "volume", 0, 100).name("Volume").step(1).onChange(function (value) {
        setMasterVolume();
    });
    audioFolder.add(audioSettings, "ambient", 0, 100).name("Ambient sound").onChange(function (value) {
        // noop, value is regarded at resumeSFX
    });

    setMasterVolume();

/*
    controlsFolder = gui.addFolder("Gamepad settings");
    controlsFolder.add(gamepadSettings, "enabled").name("Enabled").onChange(setGamepadEnabled);
    controlsFolder.add(gamepadSettings, "moveSensitivity", 0.1, 2).step(0.1).name("Move sensitivity").onChange(function (value) {
        gamepadControls.moveSensitivity = value;
    });
    controlsFolder.add(gamepadSettings, "lookSensitivity", 0.1, 2).step(0.1).name("Look sensitivity").onChange(function (value) {
        gamepadControls.lookSensitivity = value;
    });

    gamepadControls.moveSensitivity = gamepadSettings.moveSensitivity;
    gamepadControls.lookSensitivity = gamepadSettings.lookSensitivity;
    setGamepadEnabled();
*/

    gameFolder = gui.addFolder("Game settings");
    gameFolder.add(gameSettings, "itemAmount", 10, 200).step(10).name("Obj density %");
    gameFolder.add(gameSettings, "itemEffect").name("Item effects");
    gameFolder.add(gameSettings, "nightEnabled").name("Day/Night cycle").onChange(function (value) {
        let shouldBeNight = value && (Math.floor(chrystalCount / chrActions.nightMod) % 2 != 0);
        if (WEATHER.isNight() != shouldBeNight) {
            toggleNight();
            render();
        }
    });

    setSeason(gameSettings.season);

/*
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
*/
    if (isElectronApp) {
        gui.add(window, "close").name("Exit game");
    }

    // exFolder.open();
    let guiContainer = document.getElementById('guiContainer');
    guiContainer.appendChild(gui.domElement);

    updatePlayerInfo();
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

function initScene() {

    showProgressBar();

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x202020 );

    var loader = new THREE.TextureLoader();
    //loader.load('../../gfx/textures/panorama.jpg',
    loader.load('../../gfx/textures/sky_day.jpg',
        texture => {
            scene.background = texture;
            if (renderer) {
                render();
            }
        }, xhr => {
            console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        }, error => { console.log("An error happened" + error); });


    // world
    //var geometry = new THREE.PlaneGeometry( 200, 200 );
    //geometry.rotateX(Math.PI / 2);

    initLights();

    mixer = new THREE.AnimationMixer(scene);

    OBJS.load(function(newModel) {

        OBJS.createTable(scene);
        hideProgressBar();

        // load configuration

        initGame();
        startGame();

        /*if (renderer) {
            render();
        }*/

    }, onProgress, onError );

}

function initLights() {
/*
    const light = new THREE.AmbientLight( 0x080808 ); // soft white light
    scene.add( light );
*/
    const skyColor = ldrawColors.White.hex;
    const groundColor = ldrawColors.Light_Grey.hex;
    const hemiLightIntensity = 0.5; // 0.8;

    let hemiLight = new THREE.HemisphereLight(skyColor, groundColor, hemiLightIntensity);
    scene.add(hemiLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 0.6); //1);
    dirLight.position.set(1000, 2500, 500);
    dirLight.castShadow = true;

    let size = 500;
    dirLight.shadow.camera.left = -size;
    dirLight.shadow.camera.right = size;
    dirLight.shadow.camera.bottom = -size;
    dirLight.shadow.camera.top = size;

    dirLight.shadow.camera.near = 2300;
    dirLight.shadow.camera.far = 3000;
    dirLight.shadow.bias = 0.0001;

    var SHADOW_MAP_WIDTH = 4096, SHADOW_MAP_HEIGHT = 4096;
    dirLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    dirLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    // scene.add (new THREE.CameraHelper(dirLight.shadow.camera));

    scene.add(dirLight);
}

function addParcelEffect(x, z, height, time, size) {
    if (gameSettings.itemEffect) {
        WEATHER.addParticleEffect(PTFX.parcelEffect(scene, x, -z, height, time, size));
    }
}

function onProgress( xhr ) {
    if ( xhr.lengthComputable ) {
        updateProgressBar( xhr.loaded / xhr.total );
        // console.log( Math.round( xhr.loaded / xhr.total * 100, 2 ) + '% downloaded' );
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
        progressBarDiv.style.color = "#DDD";
        progressBarDiv.style.display = "block";
        progressBarDiv.style.position = "absolute";
        progressBarDiv.style.top = "50%";
        progressBarDiv.style.width = "100%";
        progressBarDiv.style.textAlign = "center";
        progressBarDiv.innerText = "Loading...";
    }

    document.body.appendChild( progressBarDiv );

    animClock.stop();
}

function hideProgressBar() {

    if (document.body.contains( progressBarDiv )) {
        document.body.removeChild( progressBarDiv );
    }

    animClock.start();
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

    gfxSettings.fullScreen = (window.screen.width == window.innerWidth); // API not working when triggered with F11

    if (!gameActive && renderer) {
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

    checkIntersections();

    function markAsPossibleCell(cell) {
        if (!highlightedHintCells.includes(cell)) {
            highlightCell(cell, possibleColor, possibleEmissive, possibleMat);
        }

        addToIntersect(cell.box);
        addToIntersect(cell.figure);
        highlightedPossibleCells.push(cell);
    }

    //resetHintHighlights();
    resetPossibleHighlights();

    if (currentHighlight) {
        // console.log(currentHighlight);

        if (status.moves[currentHighlight.id]) {
            fromCell = currentHighlight;

            if (!highlightedHintCells.includes(fromCell)){
                resetHintHighlights();
            }

            markAsPossibleCell(currentHighlight);

            status.moves[currentHighlight.id].forEach(cId => {
                markAsPossibleCell(OBJS.cells[cId]);
            });

        } else if (fromCell) {
            if (status.moves[fromCell.id].includes(currentHighlight.id)) {
                let move = game.move(fromCell.id, currentHighlight.id);

                if (move[fromCell.id] != currentHighlight.id) {
                    console.log("Something went wrong. Please restart.")
                }
                undoPossible = false;
                GUI.setDisabled(undoMoveControl, true);

                resetPlayerHints();
                performAnimatedMove(move);
            }
        }
    } else {
        // initNextMove();
    }
}

function performAnimatedMove(move) {
    let duration = performMove(move);
    if (duration == 0) {
        moveNext();
    } else {
        window.setTimeout(() => {
            moveNext();
        }, duration * 1000);
    }
}

function resetPossibleHighlights() {

    highlightedPossibleCells.forEach(c => {
        highlightCell(c, noColor, noEmissive, possibleMat);
        if (!highlightedSelectableCells.includes(c)) {
            removeFromIntersect(c.box);
            removeFromIntersect(c.figure);
        }
    });
    highlightedPossibleCells = [];
}

function checkCastling(move) {

    if (lastCastling.whiteShort && move.E1 == 'G1') {
        move.H1 = 'F1';
    } else if (lastCastling.whiteLong && move.E1 == 'C1') {
        move.A1 = 'D1';
    } else if (lastCastling.blackShort && move.E8 == 'G8') {
        move.H8 = 'F8';
    } else if (lastCastling.blackLong && move.E8 == 'C8') {
        move.A8 = 'D8';
    }

    updateCastlingStatus();
}

function performMove(move) {

    checkCastling(move);
    // console.log(move);

    let castlingMove = false;
    let duration = 0;

    for (let from in move) {
        let to = move[from];

        let fromCell = OBJS.cells[from];
        let toCell = OBJS.cells[to];

        if (toCell.figure) {
            // remove figure
            removeFromIntersect(toCell.figure);
            highlightGroup(toCell.figure, noEmissive, selectableMat);

            OBJS.clearCell(toCell);

        } else if (to == status.enPassant) { // enPassant && turn are up-to date here
            let cellName = to.charAt(0) + (Number(to.charAt(1)) + ((status.turn == 'black') ? 1 : -1)).toString();
            // console.log("Enpassant! :" + cellName);

            let cell = OBJS.cells[cellName];

            OBJS.clearCell(cell);
        }

        toCell.figure = fromCell.figure;
        toCell.figure.cell = toCell;
        fromCell.figure = null;

        removeFromIntersect(toCell.figure);
        highlightGroup(toCell.figure, noEmissive, selectableMat);

        duration = animateFigure(toCell.figure, fromCell, toCell, (toCell.figure.name.toLowerCase() != 'n' && !castlingMove) ? 10 : 100);

        window.setTimeout(() => {
            mixer.uncacheRoot(toCell.figure);
            toCell.figure.position.copy(toCell.position);

            if (status.pieces[to] != toCell.figure.name) {
                // replace figure
                OBJS.clearCell(toCell);
                // scene.remove(toCell.figure);
                OBJS.initFigure(toCell, status.pieces[to], scene);
            }
          }, duration * 1000)


        castlingMove = true;
    }
    return duration;
}

function animate() {

    if ( gameActive ) {

        requestAnimationFrame( animate );

        if (!skipFrame) {
            checkIntersections();
            //raycaster.ray.origin.copy( controls.getObject().position );
            //raycaster.ray.origin.y -= 10;

            //var intersections = raycaster.intersectObjects( objects );

            //var onObject = intersections.length > 0;

            //var delta = 0.75 * clock.getDelta();

            let animDelta = animClock.getDelta();

            if (gfxSettings.showFPS) {
                if (fps.length > 25) fps.splice(0, 1);
                    fps.push(1/ animDelta);
                    let currFps = 0;
                    for (let idx = 0; idx < fps.length; idx++) {
                        currFps += fps[idx];
                }
                currFps = Math.round(currFps / fps.length);
                playerInfo.innerHTML = currFps + " FPS";
            }

            mixer.update( animDelta );

            mapControls.update();

            let dist = OBJS.cellSize * 32;
            camera.position.clamp(new THREE.Vector3(-dist, -dist, -dist), new THREE.Vector3(dist, dist, dist));
            dist = OBJS.cellSize * 10;
            mapControls.target.clamp(new THREE.Vector3(-dist, -dist, -dist), new THREE.Vector3(dist, dist, dist));

            // WEATHER.updateParticleSystems();

            render();

            skipFrame = animDelta < 1/25;
        } else {
            skipFrame = false;
        }

    }
}

function checkIntersections() {

    if (intersectMeshes.size > 0) {

        raycaster.setFromCamera({ x: mouse.x, y: mouse.y }, camera);
        var intersects = raycaster.intersectObjects([... intersectMeshes]);
        if (intersects.length > 0) {

            let mesh = intersects[0].object;
            let cell = mesh.parent ? mesh.parent.cell : undefined;

            if (currentHighlight != cell) {
                highlightCell(currentHighlight, noColor, noEmissive, selectedMat);
                highlightCell(cell, selectedColor, selectedEmissive, selectedMat);

                currentHighlight = cell;
            }
        } else {

            highlightCell(currentHighlight, noColor, noEmissive, selectedMat);
            currentHighlight = null;
        }
    }
}

function getCamEuler(camObj) {
    let euler = camObj.rotation.clone();
    euler.reorder("YXZ");
    euler.x = 0;
    euler.z = Math.PI;

    return euler;
}

function highlightCell(cell, boxColor, colorHex, set) {
    if (cell) {
        if (cell.box) {
            highlightMaterial(cell.box.material, boxColor, set, true);
        }

        highlightGroup(cell.figure, colorHex, set);
        // highlightGroup(cell.parts, colorHex, set);
    }
}

function highlightGroup(group, colorHex, set) {
    if (group && group.isGroup) {
        let materials = new Set();

        group.traverse(c => {
            if (c.isMesh) {
                if (c.material instanceof THREE.Material) {
                    materials.add(c.material);
                }
                else {
                    c.material.forEach( mat => { materials.add(mat); }  );
                }
            }
        });

        materials.forEach(mat => { highlightMaterial(mat, colorHex, set); });
    }
}

function highlightMaterial(mat, colorHex, set, box = false) {

    if (colorHex != noEmissive) {
        if (!set.has(mat)) {
            set.add(mat);

            if (box) {
                // ANIM.blendColor(mixer, mat, colorHex, highlightDuration);
                mat.color.setHex(colorHex);
                ANIM.blendProperty(mixer, mat, 'opacity', (colorHex != noColor) ? 0.25 : 0, highlightDuration );
            } else {
                ANIM.blendColor(mixer, mat, colorHex, highlightDuration, 'emissive');
            }

        }
     } else {
        if (set != hintMat && hintMat.has(mat)) {
            colorHex = box ? hintColor : hintEmissive;
        } else if (set != possibleMat && possibleMat.has(mat)) {
            colorHex = box ? possibleColor : possibleEmissive;
        } else if (set != selectableMat && selectableMat.has(mat)) {
            colorHex = box ? selectableColor : selectableEmissive;
        } else if (set != dangerMat && dangerMat.has(mat)) {
            colorHex = box ? dangerColor : dangerEmissive;
        }

        if (box) {
            mat.color.setHex(colorHex);
            ANIM.blendProperty(mixer, mat, 'opacity', (colorHex != noColor) ? 0.25 : 0, highlightDuration );
        } else {
            ANIM.blendColor(mixer, mat, colorHex, highlightDuration, box ? 'color' : 'emissive');
        }

        set.delete(mat);
    }
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

function initGame(conf) {

    OBJS.clearTable(scene);

    game = new CHESS.Game(conf);
    status = game.exportJson();
    OBJS.initFigures(status.pieces, scene);

    updateCastlingStatus();

    moveNext();
}

function updateCastlingStatus() {
    for (let prop in status.castling) {
        lastCastling[prop] = status.castling[prop];
    }
}

function undoMove() {

    resetPlayerHints();
    let history = game.getHistory();

    // console.log(history);

    while (history.length > 0) {
        let lastMove = history[history.length - 1];
        let pieces = lastMove.configuration.pieces;

        let move = {};
        move[lastMove.from] = lastMove.to;

        for (let prop of ['isFinished', 'check', 'checkMate', 'enPassant', 'fullMove', 'halfMove', 'turn']) {
            game.board.configuration[prop] = lastMove.configuration[prop];
        }

        for (let prop in lastMove.configuration.castling) {
            lastCastling[prop] = lastMove.configuration.castling[prop];
            status.castling[prop] = lastCastling[prop];
        }
        checkCastling(move);

        for (let from in move) {
            let to = move[from];

            let fromCell = OBJS.cells[from];
            let toCell = OBJS.cells[to];

            if (to == lastMove.configuration.enPassant) {
                let enp = to.charAt(0) + (Number(to.charAt(1)) + ((lastMove.configuration.turn == 'black') ? 1 : -1)).toString();
                if (pieces[enp]) {
                    game.setPiece(enp, pieces[enp]);
                    let enpCell = OBJS.cells[enp];
                    OBJS.clearCell(enpCell);
                    OBJS.initFigure(enpCell, pieces[enp], scene);
                }
            }

            OBJS.clearCell(toCell);
            OBJS.clearCell(fromCell);
            // scene.remove(toCell.figure);

            if (pieces[to]) {
                game.setPiece(to, pieces[to]);
                OBJS.initFigure(toCell, pieces[to], scene);
            } else{
                game.removePiece(to);
            }

            game.setPiece(from, pieces[from]);
            OBJS.initFigure(fromCell, pieces[from], scene);
        }

        history.splice(history.length - 1);

        if (gameSettings[lastMove.configuration.turn] == playerLevels.human) {
            break;
        }
    }
    moveNext();
}

function moveNext() {
    status = game.exportJson();
    // console.log(status);

    let playerLevel = gameSettings[status.turn];

    undoPossible = game.getHistory().length > 0 && (status.isFinished || playerLevel == playerLevels.human);
    GUI.setDisabled(undoMoveControl, !undoPossible);

    if (!status.isFinished) {
        if (playerLevel == playerLevels.human) {
            initNextPlayerMove();
        } else {
            let move = game.aiMove(playerLevel);
            performAnimatedMove(move);
        }
    } else {
        if (status.checkMate) {
            // find lost king
            let figLetter = OBJS.figLetters[6][(status.turn == 'white' ? 0 : 1)];
            for (let cellId in OBJS.cells) {
                let cell = OBJS.cells[cellId];
                if (cell.figure && cell.figure.name == figLetter) {
                    highlightCell(cell, dangerColor, dangerEmissive, dangerMat);
                    highlightedSelectableCells.push(cell);
                    break;
                }
            }
        }
    }

}

function initNextPlayerMove() {

    GUI.setDisabled(showHintControl, false);

    for (let id in status.moves) {
        let cell = OBJS.cells[id];
        highlightCell(cell, selectableColor, selectableEmissive, selectableMat);
        addToIntersect(cell.box);
        addToIntersect(cell.figure);

        highlightedSelectableCells.push(cell);
    }
}

function showAIMoveHint() {
    let move = game.board.calculateAiMove(2);

    console.log(move);

    let fromCell = OBJS.cells[move.from];
    let toCell = OBJS.cells[move.to];

    resetHintHighlights();

    highlightedHintCells.push(fromCell);
    highlightedHintCells.push(toCell);

    highlightCell(fromCell, hintColor, hintEmissive, hintMat);
    highlightCell(toCell, hintColor, hintEmissive, hintMat);
}

function resetHintHighlights() {
    highlightedHintCells.forEach(c => {
        highlightCell(c, noColor, noEmissive, hintMat);
    });
    highlightedHintCells = [];
}

function resetPlayerHints() {

    highlightedSelectableCells.forEach(c => {
        highlightCell(c, noColor, noEmissive, dangerMat);
        highlightCell(c, noColor, noEmissive, selectableMat);
        removeFromIntersect(c.box);
        removeFromIntersect(c.figure);
    });
    highlightedSelectableCells = [];

    resetPossibleHighlights();
    resetHintHighlights();

    for (let m of dangerMat.values()) {
        highlightMaterial(m, noEmissive, dangerMat);
    }
}

function addToIntersect(obj) {
    if (obj) {
        obj.traverse(c => {
            if (c.isMesh) {
                intersectMeshes.add(c);
            }
        });
    }
}

function removeFromIntersect(obj) {
    if (obj) {
        obj.traverse(c => {
            if (c.isMesh) {
                intersectMeshes.delete(c);
            }
        });
    }
}

function animateFigure(fig, startCell, targetCell, height) {

    let clip = createMoveAnimation(startCell.position, targetCell.position, height);

    let action = mixer.clipAction(clip, fig);
    action.clampWhenFinished = true;
    action.setLoop(THREE.LoopOnce).play();

    // fig.position.copy(targetCell.position);
    return clip.duration;
}

function createMoveAnimation(startPos, endPos, height) {
    let movetime = startPos.distanceTo(endPos) / OBJS.cellSize * moveDuration;

    let riseTime = (moveDuration / 5) * (height / 10);

    var times = [0, riseTime, riseTime + movetime, riseTime * 2 + movetime];

    let xValues = [startPos.x, startPos.x, endPos.x, endPos.x];
    let zValues = [startPos.z, startPos.z, endPos.z, endPos.z];
    let yValues = [startPos.y, startPos.y + height, endPos.y + height, endPos.y];

    var xTrack = new THREE.NumberKeyframeTrack('.position[x]', times, xValues, THREE.InterpolateSmooth);
    var yTrack = new THREE.NumberKeyframeTrack('.position[y]', times, yValues, THREE.InterpolateSmooth);
    var zTrack = new THREE.NumberKeyframeTrack('.position[z]', times, zValues, THREE.InterpolateSmooth);

    return new THREE.AnimationClip(null, riseTime * 2 + movetime, [xTrack, yTrack, zTrack]);
}


// full-screen handling - a bit weird due to a complex API (thanks to F11)

function isUserFullscreen() {
    let doc = window.document;
    return doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;
}

function toggleFullScreenControl() {
    if (fullScreenControl.innerHTML.charCodeAt(0) == 0xE5D0) {
        // if full-screen entered with F11 not possible to return with API

        //fullScreenControl.style.display = "none";
        GUI.setDisabled(fullScreenControl, true);
        setFullScreenControl(false);
    } else {
        //fullScreenControl.style.display = "";
        GUI.setDisabled(fullScreenControl, false);
        setFullScreenControl(true);
    }
}

function setFullScreenControl(fs) {
    fullScreenControl.innerHTML = fs ? '&#xE5D0': '&#xE5D1';
}

function toggleFullScreen(e) {
    e.preventDefault();
    let doc = window.document;
    let docEl = doc.body;

    let requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    let cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if(!isUserFullscreen()) {
        setFullScreenControl(false);
        requestFullScreen.call(docEl);
    } else {
        cancelFullScreen.call(doc);
        setFullScreenControl(true);
    }
  }