import '../../web_modules/three/build/three.min.js';

// import { GUI } from './node_modules/three/examples/jsm/libs/dat.gui.module.js';
//import { GUI } from '../ld-framework/web_modules/three/examples/jsm/libs/dat.gui.module.js';
import { GUI as DatGUI } from '../../web_modules/dat.gui/build/dat.gui.module.js';
// import { MapControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';

import * as ANIM from '../../gfx/Animations.js';
import * as OBJ from '../../gfx/Objects.js'
import * as SFX from '../../audio/SoundFX.js';
import * as PTFX from '../../gfx/ParticleEffects.js';
import * as GUI from '../../gui/guiutils.js'

var camera, scene, renderer, composer;
var particleSystems = [];

//var rayHelper = new THREE.ArrowHelper();

var isElectronApp = (navigator.userAgent.toLowerCase().indexOf(' electron/') > -1); // detect whether run as electron app
var isTouch = ('ontouchstart' in window);

var testMode = isElectronApp;
let autoplay = false;

var fps = [];

var mixer;
var animClock = new THREE.Clock();

var hemiLight;
var dirLight;

const dirLightColor = 0xffffbb;
const dirLightIntensity = 0.6; //0.6

const skyColor = 0xB1E1FF;  // light blue
const groundColor = 0xF9BA60;  // brownish orange
const hemiLightIntensity = 0.8; // 0.8;

const emissiveIntensity = 0.1;

const visibleCols = isTouch ? 10 : 12;
const visibleRows = isTouch ? 10 : 12;

const sceneNear = 300;
const sceneFar = 500;

var mouse = new THREE.Vector2();

var currentHighlight;
var currentSelection;

const particleEffects = { rain: null, snow: null, stars: null, shootingStars: null, fireflies: null };

const cellSize = 36;
var table = [];
var tableOffset = new THREE.Vector2();

var explodedFlowers = [];

var flowerCache = [];
const availableFlowerTypes = 8;
const usedFlowerTypes = availableFlowerTypes; // availableFlowerTypes; // 4 or 5 for testing

const bombId = availableFlowerTypes;

const cellExtraType = {
    none: 0,
    horizontal: 1,
    vertical: 2,
    bomb: 4
}

const gameState = {
    inactive: -2,
    paused: -1,
    init: 0,
    play: 1,
    check: 2,
    explode: 3,
    refill: 4,
    check: 5,
    shuffle: 6,
    autoplay: 7,
    ending: 8
};

var state = gameState.inactive;

var possiblePair = [];
var hintActions = [];

const gameSpeed = {
    slow: 2.0,
    normal: 1.0,
    fast: 0.5,
    ultra: 0.2
};

var resolutions = [{ x: 0, y: 0 }, { x: 320, y: 240 }, { x: 640, y: 480 }, { x: 1024, y: 768 }, { x: 1280, y: 800 }, { x: 1920, y: 1080 }]
var resolutionNames = { 'Auto': 0, '320x240': 1, '640x480': 2, '1024x768': 3, "1280x800": 4, "1920x1080": 5 };
var projection = { orthographic: 0, perspective: 1 }; // just for fun, as perspective looks awful :)
var qualityNames = { High: 1, Low: 2 };
var audioSettings = { enabled: true, volume: 100 };
var gfxSettings = { resolution: resolutionNames.Auto, quality: qualityNames.High, fullScreen: false, projection: projection.orthographic, shadows: isTouch ? 0 : 3, antiAlias: true, showFPS: false };
var gameSettings = { itemEffect: true, speed: gameSpeed.normal, columns: 8, rows: 8 , rotate: true};

var playerSettings = { name: 'Player' }

var gui, playersFolder, gfxFolder, controlsFolder, audioFolder, gameFolder;

var progressBarDiv;
var mainDiv = document.getElementById('main');
var tableDiv = document.getElementById('table');
var topLeftDiv = document.getElementById('topLeft');
var bottomRightDiv = document.getElementById('bottomRight');
var playerInfo = document.getElementById('playerInfo');
var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');
var touchPause = document.getElementById('touchPause');

var gameActive = false;

var skipFrame = false;
var timeoutId = 0;

const okColor = 0x00ff00, wrongColor = 0xff0000, selectedEmissive = 0x0000ff;
const fLightsColor = 0xffffff, rLightsColor = 0xff0000, windowColor = 0xffffbb;

var textEmissive = 0x000000;

// main entry point
init();

//#region Initialization

function init() {

    /* check whether this is needed
    if (isTouch) {
        document.body.style.setProperty('height', window.innerHeight + 'px');
    }
    */

    initScene();
    initRendering();
    initControls();
    //SFX.init(camera);
    initDatGUI();
}

function initScene() {

    // updateTable(true);
    showProgressBar();

    scene = new THREE.Scene();
    //scene.background = new THREE.Color(0x60aa60);

    // scene.fog = new THREE.Fog(0xaaaaaa, sceneNear, sceneFar);// .FogExp2( 0xcccccc, 0.0003);

    //let ambiLight = new THREE.AmbientLight(0xffffff, 0.6);
    //scene.add(ambiLight);

    // world
    //var geometry = new THREE.PlaneGeometry( 200, 200 );
    //geometry.rotateX(Math.PI / 2);

    hemiLight = new THREE.HemisphereLight(skyColor, groundColor, hemiLightIntensity);
    scene.add(hemiLight);

    dirLight = new THREE.DirectionalLight(dirLightColor, dirLightIntensity); //1);
    let dirOffset = (sceneNear + sceneFar);
    dirLight.position.set(dirOffset, dirOffset, dirOffset * 0.5);

    dirLight.castShadow = true;
    let size = 5000;
    dirLight.shadow.camera.left = -size;
    dirLight.shadow.camera.right = size;
    dirLight.shadow.camera.bottom = -size;
    dirLight.shadow.camera.top = size;
    dirLight.shadow.camera.near = dirOffset;
    dirLight.shadow.camera.far = dirOffset * 2;
    dirLight.shadow.bias = 0.0001;

    //scene.add (new THREE.CameraHelper(dirLight.shadow.camera));

    let SHADOW_MAP_SIZE = 2048;
    dirLight.shadow.mapSize.width = SHADOW_MAP_SIZE;
    dirLight.shadow.mapSize.height = SHADOW_MAP_SIZE;
    scene.add(dirLight);

    /*
        var loader = new THREE.TextureLoader();
        loader.load('./gfx/textures/sky_day.jpg',
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
    */
    /*
    var light = new THREE.DirectionalLight(0x002288);
    light.position.set(-1, -1, -1);
    scene.add(light);
    */

    //var light = new THREE.AmbientLight(0x222222);
    //scene.add(light);

    mixer = new THREE.AnimationMixer(scene);

    OBJ.loadModel('flowers', model => {
        for (let flowerIdx = 0; flowerIdx < availableFlowerTypes + 1; flowerIdx++) { // + 1 to load "bomb" also
            let flower = model.children[flowerIdx].children[0];

            flower.material[0].color.offsetHSL(0, 0.4, 0);

            flower.material[0].roughness = 0.25;
            flower.material[0].emissive  = flower.material[0].color;
            flower.material[0].emissiveIntensity = emissiveIntensity;

            let group = new THREE.Group();
            group.add(flower);

            let box = new THREE.Box3().setFromObject(flower);
            flower.translateX((box.max.x + box.min.x) / -2);
            flower.translateY((box.max.y + box.min.y) / -2);
            flower.translateZ((box.max.z + box.min.z) / -2);

            box = new THREE.Box3().setFromObject(flower);

            group.rotateX(-Math.PI / 2);

            let angle = -30 / 180 * Math.PI;
            group.rotateX(angle);

            flowerCache.push(group);
        }

        hideProgressBar();
        // updateTable(false);
        document.getElementById("startup").style.display = 'none';
        updateBlocker(false);
    }, onProgress, onError);
}

function initRendering() {
    renderer = new THREE.WebGLRenderer({ antialias: gfxSettings.antiAlias , alpha: true });
    // renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(window.innerWidth, window.innerHeight);

    //renderer.outputEncoding = THREE.sRGBEncoding;
    //renderer.gammaFactor = 2.2;
    //renderer.gammaOutput = true;

    updateShadows(gameSettings.shadow);
    // renderer.physicallyCorrectLights = true;
    renderer.domElement.setAttribute('style', "position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; margin: auto");
    tableDiv.appendChild(renderer.domElement);
    // document.body.insertBefore(renderer.domElement, document.getElementById('blocker'));

    // document.body.appendChild(renderer.domElement);
    if (gfxSettings.projection == projection.orthographic) {
        let ratio = Math.max(visibleCols * cellSize / window.innerWidth, visibleRows * cellSize / window.innerHeight) / 2;
        camera = new THREE.OrthographicCamera(-ratio * window.innerWidth, ratio * window.innerWidth, ratio * window.innerHeight, -ratio * window.innerHeight, sceneNear, sceneFar);
        camera.position.set(0, 0, (sceneNear + sceneFar) / 2);
    } else if (gfxSettings.projection == projection.perspective) {
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, sceneNear / 3 , sceneFar * 3);
        camera.up = new THREE.Vector3(0, 1, 0);
        camera.lookAt(0, 0, 0);
        camera.position.set(0, 0, (sceneNear + sceneFar) / 2);
    }

    window.addEventListener('resize', onWindowResize, false);
}

function initControls() {

    if (isTouch) {
        instructions.addEventListener('touchstart', function (e) {
            // openFullscreen();
            window.history.pushState({}, '');
            startGame();
        }, false);

        /*
        document.getElementById('clickSpan').addEventListener( 'click', function () {
            startGame();
        }, false );
        */

        window.addEventListener('popstate', function () {
            startPausing();
        });
    } else {
        instructions.addEventListener('click', function () {
            startGame();
        }, false);
    }

    var onKeyDown = function (event) {

        //console.log("down " + event.keyCode);
        switch (event.keyCode) {

            case 8: // backspace
                if (animClock.running) {
                    animClock.stop();
                } else {
                    animClock.start();
                }
                break;
            case 65: // 'a'
                autoplay = !autoplay;
                if (state == gameState.play) {
                    cancelHint(true);
                }
                break;
        }
    };

    var onKeyUp = function (event) {

        //console.log("up " + event.keyCode);
        switch (event.keyCode) {
            case 27: //ESC
                startPausing();
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
}

//#endregion

function startPausing() {
    gameActive = false;
    cancelHint(false);
    updateBlocker(false);

    //document.removeEventListener('click', onDocumentClick);

    document.removeEventListener('mousemove', onDocumentMouseMove);
    document.removeEventListener('mousedown', onDocumentMouseDown);
    document.removeEventListener('mouseup', onDocumentMouseUp);

    if (isTouch) {
        tableDiv.removeEventListener('touchmove', onTableTouchMove);
        tableDiv.removeEventListener('touchstart', onTableTouchStart);
        tableDiv.removeEventListener('touchend', onTableTouchEnd);
        //touchPause.removeEventListener('touchend', onTouchPauseClick);
    }

    touchPause.removeEventListener("click", onTouchPauseClick);

    SFX.pause();

    if (state == gameState.play) {
        pauseGame();
    }
}

function pauseGame() {
    setState(gameState.paused);
    animClock.stop();
}

function startGame() {
    requestAnimationFrame(animate);

    updateBlocker(true);

    //document.addEventListener('click', onDocumentClick, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);

    if (isTouch) {
        tableDiv.addEventListener('touchmove', onTableTouchMove, { passive: false }); // prevent scroll on touch
        tableDiv.addEventListener('touchstart', onTableTouchStart, { passive: false }); // prevent scroll on touch
        tableDiv.addEventListener('touchend', onTableTouchEnd, { passive: false });
    }

    touchPause.addEventListener('click', onTouchPauseClick, false);

    SFX.resume();

    animClock.start();
    gameActive = true;

    if (state == gameState.inactive)  {
        resetTable();
    } else if (state == gameState.paused) {
        setState(gameState.play);
    }
}

function updateTable(hide) {
    if (hide) {
        mainDiv.style.display ='none';
    } else {
        mainDiv.style.display ='';
    }
}

function updateBlocker(hide) {
    if (hide) {
        instructions.style.display = 'none';
        blocker.style.display = 'none';

        touchPause.style.display = 'block';
    } else {
        blocker.style.display = 'block';
        instructions.style.display = '';
        touchPause.style.display = 'none';
    }
}

function highlightTouchControl(control) {
    control.style.background = 'rgba(128,128,128,0.6)';
}

function resetTouchControl(control) {
    control.style.background = '';
}

//#region Document events

function onTouchPauseClick(e) {
    e.preventDefault();
    highlightTouchControl(touchPause);

    if (isTouch && !isElectronApp) {
        window.history.back();
    } else {
        startPausing();
    }

    resetTouchControl(touchPause);
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = event.clientX; // ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = event.clientY; //- ( event.clientY / window.innerHeight ) * 2 + 1;
    checkCellIntersections();
}

function onDocumentMouseDown(event) {
    event.preventDefault();
    handlePress();
}

function onDocumentMouseUp(event) {
    event.preventDefault();
    handleRelease();
}

function onTableTouchMove(event) {
    event.preventDefault();
    let touch = event.changedTouches[0];
    mouse.x = touch.pageX;
    mouse.y = touch.pageY;

    checkCellIntersections();

    if (currentSelection != currentHighlight) {
        handleRelease();
    }
}

function onTableTouchStart(event) {
    //event.preventDefault();
    onTableTouchMove(event);
    checkCellIntersections();
    handlePress();
}

function onTableTouchEnd(event) {
    event.preventDefault();
    handleRelease();
}

function handlePress() {
    if (state == gameState.play && currentHighlight && !currentSelection || !areNeighbors(currentHighlight, currentSelection) && currentSelection != currentHighlight) {
        cancelHint(!autoplay);
        setCellHighlight(currentSelection, false);
        currentSelection = currentHighlight;
    }
}

function handleRelease() {

    if (state == gameState.play && currentHighlight != currentSelection) {

        let neighbors = areNeighbors(currentHighlight, currentSelection);

        cancelHint(!neighbors && !autoplay);

        // evaluate
        if (neighbors) {

            setState(gameState.check);

            setCellHighlight(currentHighlight, false);
            setCellHighlight(currentSelection, false);

            trySwitchCells(currentSelection, currentHighlight);

            currentSelection = null;
            currentHighlight = null;

        } else if (isTouch) {
            setCellHighlight(currentHighlight, false);
            currentHighlight = null;
        }
    }
}

//#endregion

//#region Main scene functions

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

    ANIM.blendProperty(mixer, dirLight, 'intensity', dirLightIntensity, 3);

    //let action = mixer.clipAction(ANIM.createHighlightAnimation(1, 1), dirLight);

    let sphereGeo = new THREE.SphereBufferGeometry(250, 32, 32);
    let sphereMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffdd, emissiveIntensity: 1, roughness: 1 });
    let sphere = new THREE.Mesh(sphereGeo, sphereMat);

    sphere.position.copy(dirLight.position).normalize().multiplyScalar(11.9 * WORLD.plateSize);
    scene.add(sphere);
}

function addParcelEffect(x, z, height, time, size) {
    if (gameSettings.itemEffect) {
        particleSystems.push(PTFX.parcelEffect(scene, x, -z, height, time, size));
    }
}

//#endregion

//#region Settings GUI

function initDatGUI() {

    gui = new DatGUI({ autoPlace: false });

    gui.useLocalStorage = true;

    gui.remember(gfxSettings);
    gui.remember(audioSettings);
    gui.remember(gameSettings);
    gui.remember(playerSettings);

    gfxFolder = gui.addFolder("Graphics settings");

    /*
    gfxFolder.add(gfxSettings, "resolution", resolutionNames).name("Resolution").onChange(function (value) {
        // update resolution
        onWindowResize();
    });
    */

    gfxFolder.add(gfxSettings, "quality", qualityNames).name("Render quality").onChange(function (value) {
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

    gfxFolder.add(gfxSettings, "shadows", 0, 3, 1).name("Shadows").onChange(function (value) {
        // update shadows
        updateShadows(value);
        render();
    });

    updateShadows(gfxSettings.shadows);

    gfxFolder.add(gfxSettings, "showFPS").name("Show FPS").onChange(function (value) {
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

    setMasterVolume();

    gui.add({ reset: function() { resetTable(); } }, "reset").name("Reset table");

    gameFolder = gui.addFolder("Game settings");

    gameFolder.add(gameSettings, "itemEffect").name("Item effects");
    gameFolder.add(gameSettings, "speed", gameSpeed).name("Speed");
    gameFolder.add(gameSettings, "columns", 4, visibleCols - 1).step(1).name("Columns").onChange(resetTable);
    gameFolder.add(gameSettings, "rows", 4, visibleRows - 1).step(1).name("Rows").onChange(resetTable);

    gameFolder.add(gameSettings, "rotate").name("Enable rotation").onChange(updateRotation);

    if (isElectronApp) {
        gui.add(window, "close").name("Exit game");
    }

    // exFolder.open();
    let guiContainer = document.getElementById('guiContainer');
    guiContainer.appendChild(gui.domElement);

    updatePlayerInfo();
}

function updateRotation(value) {
    for (let cell of getFlatTable()) {
        if (value) {
            startRotation(cell);
        } else if (cell.flower && cell.flower.flowerMesh) {
            mixer.uncacheRoot(cell.flower.flowerMesh);
        }
    }
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

//#endregion

//#region Progressbar

function onProgress(xhr) {
    if (xhr.lengthComputable) {
        updateProgressBar(xhr.loaded / xhr.total);
        console.log(Math.round(xhr.loaded / xhr.total * 100, 2) + '% downloaded');
    }
}

function onError() {
    var message = "Error loading model";
    progressBarDiv.innerText = message;
    console.log(message);
}

function showProgressBar() {

    if (!progressBarDiv) {
        progressBarDiv = document.createElement('div');
        progressBarDiv.style.fontSize = "3em";
        progressBarDiv.style.color = "#888";
        progressBarDiv.style.display = "block";
        progressBarDiv.style.position = "absolute";
        progressBarDiv.style.top = "50%";
        progressBarDiv.style.width = "100%";
        progressBarDiv.style.textAlign = "center";
        progressBarDiv.style.zIndex = 500;
        progressBarDiv.innerText = "Loading...";
    }

    document.body.appendChild(progressBarDiv);

    animClock.stop();
}

function hideProgressBar() {

    if (document.body.contains(progressBarDiv)) {
        document.body.removeChild(progressBarDiv);
    }

    animClock.start();
}

function updateProgressBar(fraction) {

    progressBarDiv.innerText = 'Loading... ' + Math.round(fraction * 100, 2) + '%';

}

//#endregion

function setState(newState) {
    state = newState;

    switch (newState) {
        case gameState.init:
            break;
        case gameState.play:
            if (!isTouch) {
                checkCellIntersections();
            }
            cancelHint(gameActive);
            if (!gameActive) pauseGame();
            break;

        default:
            break;
    }

}

//#region Generate table and cells

function generateRandomId() {
    return Math.floor(Math.random() * usedFlowerTypes) + 1;
}

function resetTable() {
    clearTable();
    initTable(gameSettings.columns, gameSettings.rows);
    render();
}

function initTable(cols, rows) {

    tableOffset.x = ((cols - 1) / -2) * cellSize;
    tableOffset.y = ((rows - 1) / -2) * cellSize;

    table = [cols];
    for (let colIdx = 0; colIdx < cols; colIdx++) {
        table[colIdx] = [];
        for (let rowIdx = 0; rowIdx < rows; rowIdx++) {

            let newCell = {
                x: tableOffset.x + colIdx * cellSize,
                y: tableOffset.y + rowIdx * cellSize,
                row: rowIdx,
                col: colIdx,
                upgrade: cellExtraType.none,
                extras: cellExtraType.none
             };

             table[colIdx].push(newCell);

            do {
                newCell.itemId = generateRandomId();
            } while (checkThree(newCell)); // avoid match at initial state

            addNewFlower(newCell);

            addCellBox(newCell, ((colIdx + rowIdx) % 2 == 1));

            addCellBorder(newCell);
        }
    }

    for (let flowerIdx = 0; flowerIdx < availableFlowerTypes; flowerIdx++) {
        explodedFlowers[flowerIdx] = 0;
    }

    checkPossibleMove();
}

function addCellBorder(newCell) {
    let hSize = cellSize / 2;
    let iSize = hSize - 0.5;

    let shape = new THREE.Shape();
    shape.moveTo(-hSize, -hSize);
    shape.lineTo(hSize, -hSize);
    shape.lineTo(hSize, hSize);
    shape.lineTo(-hSize, hSize);
    shape.lineTo(-hSize, iSize);
    shape.lineTo(iSize, iSize);
    shape.lineTo(iSize, -iSize);
    shape.lineTo(-iSize, -iSize);
    shape.lineTo(-iSize, iSize);
    shape.lineTo(-hSize, iSize);
    shape.lineTo(-hSize, -hSize);

    const extrudeSettings = {
        steps: 2,
        depth: 5,
        bevelEnabled: true,
        bevelThickness: 0.5,
        bevelSize: 1,
        bevelSegments: 2,
    };

    let borderGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    borderGeo.translate(newCell.x, newCell.y, -10);

    let border = new THREE.Mesh(borderGeo, new THREE.MeshStandardMaterial({ color: 0x449999 , transparent:true, opacity:0.3 }));
    border.castShadow = false;
    border.receiveShadow = false;
    scene.add(border);

    newCell.border = border;
}

function clearTable() {
    for (let rowIdx = 0; rowIdx < table.length; rowIdx++) {
        for (let colIdx = 0; colIdx < table[rowIdx].length; colIdx++) {
            let cell = table[rowIdx][colIdx];
            if (cell.flower) {
                removeFlower(cell);
            }
            scene.remove(cell.border);
            scene.remove(cell.cellBox);
            if (cell.deco) {
                scene.remove(cell.deco);
            }
        }
    }
}

function addCellBox(newCell, altColor) {
    let cellBoxGeo = new THREE.BoxBufferGeometry(cellSize, cellSize, 2);
    let colorHex = altColor ? 0x888888 : 0x222222;
    let cellBoxMat = new THREE.MeshStandardMaterial({ color: colorHex, transparent: true, opacity: 0.25, emissive: 0x33ccff, emissiveIntensity: 0 });

    let cellBox = new THREE.Mesh(cellBoxGeo, cellBoxMat);
    cellBox.translateX(newCell.x);
    cellBox.translateY(newCell.y);
    cellBox.translateZ(-cellSize / 2);

    cellBox.castShadow = false;
    cellBox.receiveShadow = true;

    scene.add(cellBox);

    newCell.cellBox = cellBox;
}

function removeFlower(cell) {
    if (cell && cell.flower) {
        if (cell.flower.flowerMesh) {
            mixer.uncacheRoot(cell.flower.flowerMesh);
        }
        mixer.uncacheRoot(cell.flower);
        scene.remove(cell.flower);
    }
}

function addNewFlower(newCell, updatePos = true) {
    let flowerIdx = newCell.itemId - 1;

    removeFlower(newCell);

    newCell.flower = new THREE.Group();
    newCell.flower.flowerMesh = flowerCache[flowerIdx].clone();
    newCell.flower.add (newCell.flower.flowerMesh);

    // newCell.flower = flowerCache[counter++ % flowerTypes].clone();
    initCellObject(newCell, updatePos);
}

function initCellObject(newCell, updatePos) {
    if (updatePos) {
        newCell.flower.position.x = newCell.x;
        newCell.flower.position.y = newCell.y;
    }
    if (gameSettings.rotate) {
        startRotation(newCell);
    }
    scene.add(newCell.flower);
}

function startRotation(newCell) {
    let clip = ANIM.createRotationAnimation(1, 'y');
    var action = mixer.clipAction(clip, newCell.flower.flowerMesh);

    action.duration = 60;
    action.setLoop(THREE.LoopRepeat).setDuration(action.duration).play();
}

//#endregion

//#region Functions for finding matches

function areNeighbors(cell1, cell2) {
    return (cell1 && cell2) ? (cell1.col == cell2.col && Math.abs(cell1.row - cell2.row) == 1) || (cell1.row == cell2.row && Math.abs(cell1.col - cell2.col) == 1) : false;
}

function getLeft(cell) {
    return cell.col > 0 && table.length > cell.col - 1 && table[cell.col - 1].length > cell.row ? table[cell.col - 1][cell.row] : null;
}
function getRight(cell) {
    return cell.col < (table.length - 1) && table[cell.col + 1].length > cell.row ? table[cell.col + 1][cell.row] : null;
}

function getAbove(cell) {
    return table.length > cell.col && cell.row > 0 && table[cell.col].length > cell.row - 1 ? table[cell.col][cell.row - 1] : null;
}

function getBelow(cell) {
    return table.length > cell.col && cell.row < (table[cell.col].length - 1) ? table[cell.col][cell.row + 1] : null;
}

function findallLeft(cell, cells) {
    let left = getLeft(cell);
    if (left && left.itemId == cell.itemId) {
        cells.push(left);
        findallLeft(left, cells);
    }
}

function findallRight(cell, cells) {
    let right = getRight(cell);
    if (right && right.itemId == cell.itemId) {
        cells.push(right);
        findallRight(right, cells);
    }
}

function findallBelow(cell, cells) {
    let below = getBelow(cell);
    if (below && below.itemId == cell.itemId) {
        cells.push(below);
        findallBelow(below, cells);
    }
}

function findallAbove(cell, cells) {
    let above = getAbove(cell);
    if (above && above.itemId == cell.itemId) {
        cells.push(above);
        findallAbove(above, cells);
    }
}

function findAllHor(cell) {
    let cells = [];
    findallRight(cell, cells);
    findallLeft(cell, cells);
    return cells;
}

function findAllVert(cell) {
    let cells = [];
    findallBelow(cell, cells);
    findallAbove(cell, cells);
    return cells;
}

function checkThree(cell) {
    // faster checking without finding all matches
    return (findAllHor(cell).length > 1) || (findAllVert(cell).length > 1);
}

//#endregion

//#region Hint functions

function scheduleHintOrAutomove() {
    let cell1 = possiblePair[0];
    let cell2 = possiblePair[1];
    timeoutId = window.setTimeout(function () {
        if (cell1 && cell2) {
            if (state == gameState.play && autoplay && cell1 && cell2) {
                // console.log('Move: (' + cell1.col + ', ' + cell1.row + ') <-> (' + cell2.col + ', ' + cell2.row + ')');
                trySwitchCells(cell1, cell2);
            } else {
                showPossibleMove(cell1, cell2);
            }
        }
    }, (autoplay ? 0.1 : 5) * 1000);
}

function cancelHint(reschedule) {

    window.clearTimeout(timeoutId);

    while (hintActions.length > 0) {
        let action = hintActions.shift();
        action.stop();
        mixer.uncacheAction(action);
    }

    if (reschedule) {
        scheduleHintOrAutomove();
    }
}

//#endregion

function prepareExplode(cell) {
    let verts = findAllVert(cell);
    let hors = findAllHor(cell);

    let result = [];

    cell.upgrade = cellExtraType.none;

    if (verts.length > 1) {
        result.push(...verts);
        if (verts.length > 3) {
            cell.upgrade = cellExtraType.bomb;
        } else {
            if (hors.length > 1) {
                cell.upgrade |= (cellExtraType.vertical | cellExtraType.horizontal);
            } else if (verts.length > 2) {
                cell.upgrade |= cellExtraType.vertical;
            }
        }
    }

    if (hors.length > 1) {
        result.push(...hors);
        if (hors.length > 3) {
            cell.upgrade = cellExtraType.bomb;
        } else if (hors.length > 2 && cell.upgrade != cellExtraType.bomb) {
            cell.upgrade |= cellExtraType.horizontal;
        }
    }

    if (result.length > 0) {
        result.push(cell);
    }

    return result;
}

function trySwitchCells(cell1, cell2) {

    switchIds(cell1, cell2);

    let cellsToExplode;
    let bombCell;
    let normalStep = false;

    if (cell1.extras == cellExtraType.bomb || cell2.extras == cellExtraType.bomb) {
        if (cell1.extras == cell2.extras) {
            cellsToExplode = new Set([cell1, cell2]);
        } else {
            let xcell;
            if (cell1.extras == cellExtraType.bomb) {
                bombCell = cell1;
                xcell = cell2;
            } else {
                bombCell = cell2;
                xcell = cell1;
            }

            let viewSize = getviewSize();

            cellsToExplode = new Set([bombCell]);
            for (let cell of getFlatTable()) {
                if (cell.itemId == xcell.itemId) {
                    if (xcell.extras != cell.extras) {
                        cell.extras |= xcell.extras;
                        updateExtras(cell);
                    }

                    addBombEffect(bombCell, cell, viewSize);

                    cellsToExplode.add(cell);
                }
            }

            for (let cell of cellsToExplode) {
                addExtraCellsToExplode(cell, cellsToExplode);
            }
        }
    } else if (cell1.extras && cell1.extras != cellExtraType.none && cell2.extras && cell2.extras != cellExtraType.none) {

        let bothFlags = (cellExtraType.vertical | cellExtraType.horizontal);
        let diagonal = (cell1.extras & bothFlags) == bothFlags || (cell2.extras & bothFlags) == bothFlags;

        cell2.extras |= bothFlags;
        cell1.extras = cellExtraType.none;

        cellsToExplode = new Set();

        addExtraCellsToExplode(cell2, cellsToExplode, true); // only at target

        if (diagonal) {
            let cols = table.length;
            let rows = table[0].length;
            // find also diagonals
            let max = Math.max(cell2.col, cell2.row, cols - cell2.col,  rows - cell2.row);

            for (let counter = 1; counter < max; counter++) {
                let row1 = cell2.row - counter;
                let row2 = cell2.row + counter;
                let col1 = cell2.col - counter;
                let col2 = cell2.col + counter;

                if (col1 > 0 && row1 > 0) {
                    addExtraCellsToExplode(table[col1][row1], cellsToExplode, true);
                }

                if (col1 > 0 && row2 < rows) {
                    addExtraCellsToExplode(table[col1][row2], cellsToExplode, true);
                }

                if (col2 < cols && row1 > 0) {
                    addExtraCellsToExplode(table[col2][row1], cellsToExplode, true);
                }

                if (col2 < cols && row2 < rows) {
                    addExtraCellsToExplode(table[col2][row2], cellsToExplode, true);
                }
            }
        }


    } else {
        // default behavior
        cellsToExplode = findAllCellsToExplode([cell1, cell2]);
        normalStep = true;
    }

    if (cellsToExplode.size > 0) {
        exchangeFlowers(cell1, cell2, true, function () {
            explodeCells([...cellsToExplode], bombCell);
        }, 1, normalStep, bombCell);

    } else {
        // undo
        switchIds(cell1, cell2);
        exchangeFlowers(cell1, cell2, false, function () {
            setState(gameState.play);
        }, 1, true, false);
    }
}


function getviewSize() {
    return (Math.min(window.innerHeight, window.innerWidth));
}


function explodeCells(cellsToExplode, bombCell) {
    if (cellsToExplode && cellsToExplode.length > 0) {
        setState(gameState.explode);

        let viewSize = getviewSize();

        let flowersToExplode = [];
        for (let cell of cellsToExplode) {

            explodedFlowers[cell.itemId]++;

            particleSystems.push(PTFX.explode(cell.cellBox, cellSize, viewSize, gameSettings.speed));

            if (cell.upgrade == cellExtraType.none) {
                flowersToExplode.push(cell.flower);
                cell.itemId = 0;
                cell.extras = cellExtraType.none;
            } else {
                cell.extras = cell.upgrade;
                cell.upgrade = cellExtraType.none;

                if (cell.extras == cellExtraType.bomb) {
                    flowersToExplode.push(cell.flower);
                    cell.itemId = bombId;
                }

                updateExtras(cell);
            }
        }

        explodeFlowers(flowersToExplode, function () {
            removeFlower(bombCell);
            refillCells(cellsToExplode);
        });
    }
}

function addExtraCellsToExplode(cell, cellsToExplode, include = false) {
    if ((cell.extras & cellExtraType.vertical) == cellExtraType.vertical) {
        checkExtraCells(table[cell.col]);
    }
    if ((cell.extras & cellExtraType.horizontal) == cellExtraType.horizontal) {
        let row = [];
        for (let col of table) {
            row.push(col[cell.row]);
        }
        checkExtraCells(row);
    }

    cell.extras = cellExtraType.none;

    if (include) {
        cellsToExplode.add(cell);
    }

    function checkExtraCells(cells) {
        for (let cellToExplode of cells) {
            if (!cellsToExplode.has(cellToExplode)) {
                cellsToExplode.add(cellToExplode);
                addExtraCellsToExplode(cellToExplode, cellsToExplode);
            }
        }
    }
}

function checkChangedCells(changedCells) {
    setState(gameState.check);

    let cellsToExplode = findAllCellsToExplode(changedCells);

    if (cellsToExplode.size > 1) {
        explodeCells([...cellsToExplode]);
    } else {
        checkPossibleMove();
    }
}

function findAllCellsToExplode(changedCells) {
    let cellsToExplode = new Set();

    for (let changedCell of changedCells) {

        let localCellsToExplode = prepareExplode(changedCell);
        let highestUpgradeCell;
        // spread operator not working ?
        for (let cell of localCellsToExplode) {

            if (!highestUpgradeCell || (cell.upgrade > highestUpgradeCell.upgrade)) {
                highestUpgradeCell = cell;
            }

            addExtraCellsToExplode(cell, cellsToExplode, true);
        }
        // revert upgrade for other cells
        for (let cell of localCellsToExplode) {
            if (cell != highestUpgradeCell) {
                cell.upgrade = cellExtraType.none;
            }
        }
    }
    return cellsToExplode;
}

//#region Table helper functions

function getFlatTable() {
    let flatTable = [];
    for (let col of table) {
        flatTable = flatTable.concat(col);
    }
    return flatTable;
}

function switchIds(cell1, cell2) {
    let temp = cell1.itemId;
    cell1.itemId = cell2.itemId;
    cell2.itemId = temp;

    temp = cell1.extras;
    cell1.extras = cell2.extras;
    cell2.extras = temp;
}

function isSwitchPossible(cell1, cell2) {
    let possible = false;
    if (cell1 && cell2) {
        if (cell1.extras == cellExtraType.bomb || cell2.extras == cellExtraType.bomb) {
            possible = (cell1.extras != cell2.extras);
        } else if (cell1.extras != cellExtraType.none && cell2.extras != cellExtraType.none) {
            possible = true;
        } else {
            switchIds(cell1, cell2);
            possible = (checkThree(cell1) || checkThree(cell2));
            switchIds(cell1, cell2);
        }
    }
    return possible;
}

//#endregion

function checkPossibleMove() {

    let canSwitch = false;
    let neighbor;

    possiblePair = [];

    let flatTable = getFlatTable();

    while (flatTable.length > 0) {
        let idx = Math.floor(Math.random() * flatTable.length);
        let cell = flatTable.splice(idx, 1)[0];

        if (isSwitchPossible(cell, neighbor = getLeft(cell)) || isSwitchPossible(cell, neighbor = getAbove(cell))) {
            canSwitch = true;
            possiblePair = [cell, neighbor];

            // console.log('Possible: (' + cell.col + ', ' + cell.row + ') <-> (' + neighbor.col + ', ' + neighbor.row + ')');
            break;
        }
    }

    if (canSwitch) {
        setState(gameState.play);
    } else {
        // shuffle
        console.log('NO more possibilities! - shuffling');
        shuffleTable();
    }

    return canSwitch;
}

function shuffleTable() {

    setState(gameState.shuffle);

    let flatTable = getFlatTable();

    while (flatTable.length > 1) {
        let idx = Math.floor(Math.random() * flatTable.length);
        let cell1 = flatTable.splice(idx, 1)[0];
        idx = Math.floor(Math.random() * flatTable.length);
        let cell2 = flatTable.splice(idx, 1)[0];

        switchIds(cell1, cell2);

        let afterExchange;

        if (flatTable.length <= 1) {
            // last item
            afterExchange = function () {
                checkChangedCells(getFlatTable());
            };
        }

        exchangeFlowers(cell1, cell2, true, afterExchange, 3, true);
    }
}

function refillCells(cells) {
    setState(gameState.refill);

    let changedCells = new Set();

    while (cells.length > 0) {

        let cell = cells.shift();
        let col = table[cell.col];

        if (cell.itemId == 0) {
            if (cell.row < col.length - 1) {
                for (let rowIdx = cell.row + 1; rowIdx < col.length; rowIdx++) {
                    let replaceCell = col[rowIdx];
                    if (replaceCell.itemId > 0) {
                        cell.itemId = replaceCell.itemId;

                        replaceCell.itemId = 0;

                        cell.extras = replaceCell.extras;
                        replaceCell.extras = cellExtraType.none;

                        cell.upgrade = replaceCell.upgrade;
                        replaceCell.upgrade = cellExtraType.none;

                        let temp = cell.flower;
                        cell.flower = replaceCell.flower;
                        replaceCell.flower = temp;

                        cells.push(replaceCell);
                        break;
                    }
                }
            }
        }

        if (cell.itemId == 0) {
            // create a new item

            cell.itemId = generateRandomId();
            addNewFlower(cell, false);

            cell.extras = cellExtraType.none;
            cell.upgrade = cellExtraType.none;

            cell.flower.position.x = cell.x;
            cell.flower.position.y = -tableOffset.y + cellSize;
            cell.flower.visible = false;
        }

        changedCells.add(cell);
    }

    showRefilledcells(changedCells, function() { checkChangedCells(changedCells) });
}

//#region Animations / Update visuals

function showPossibleMove(cell1, cell2) {
    let c1 = new THREE.Vector2(cell1.x, cell1.y);
    let c2 = new THREE.Vector2(cell2.x, cell2.y);
    let aux1 = new THREE.Vector2().lerpVectors(c1, c2, 0.2);
    let aux2 = new THREE.Vector2().lerpVectors(c2, c1, 0.2);

    let clip1 = ANIM.createCurveAnimation(c1, aux1, aux1);
    let clip2 = ANIM.createCurveAnimation(c2, aux2, aux2);

    let action1 = mixer.clipAction(clip1, cell1.flower);
    let action2 = mixer.clipAction(clip2, cell2.flower);

    let time = 0.3; // indifferent of speed

    action1.setDuration(time).setLoop(THREE.LoopPingPong).play();
    action2.setDuration(time).setLoop(THREE.LoopPingPong).play();

    hintActions.push(action1);
    hintActions.push(action2);
}

function exchangeFlowers(cell1, cell2, keep, afterExchange, timeFactor = 1, both = true, delay = false) {
    if (cell1.flower && cell2.flower) {
        let c1 = new THREE.Vector2(cell1.x, cell1.y);
        let c2 = new THREE.Vector2(cell2.x, cell2.y);
        let aux1 = new THREE.Vector2().lerpVectors(c1, c2, 0.5);
        let aux2 = new THREE.Vector2().lerpVectors(c2, c1, 0.5);

        let offset = cellSize / 3;

        if (aux1.x == c1.x) {
            aux1.x -= offset;
        } else {
            aux1.y -= offset;
        }

        if (aux2.x == c2.x) {
            aux2.x += offset;
        } else {
            aux2.y += offset;
        }

        let time = gameSettings.speed / 4 * timeFactor;

        let clip1 = ANIM.createCurveAnimation(c1, c2, aux1);
        let action1 = mixer.clipAction(clip1, cell1.flower);
        action1.clampWhenFinished = keep;
        action1.setDuration(time).setLoop(keep ? THREE.LoopOnce : THREE.LoopPingPong, 2).play();

        let clip2 = ANIM.createCurveAnimation(c2, c1, aux2);
        let action2 = mixer.clipAction(clip2, cell2.flower);
        action2.clampWhenFinished = keep;

        if (both) {
            action2.setDuration(time).setLoop(keep ? THREE.LoopOnce : THREE.LoopPingPong, 2).play();
        }

        if (keep) {
            let temp = cell1.flower;
            cell1.flower = cell2.flower;
            cell2.flower = temp;
        }

        window.setTimeout(function () {

            action1.stop();
            mixer.uncacheAction(action1);

            action2.stop();
            mixer.uncacheAction(action2);

            cell1.flower.position.x = cell1.x;
            cell1.flower.position.y = cell1.y;

            cell2.flower.position.x = cell2.x;
            cell2.flower.position.y = cell2.y;

            if (afterExchange) afterExchange();

        }, time * (keep ? 1000 : 2000) * (delay ? 2 : 1));

    }
}

function explodeFlowers(flowers, afterExplode) {

    // do some fancy animation...
    let time = gameSettings.speed * 0.5;

    for (let flower of flowers) {
        ANIM.blendScale(mixer, flower, 0, time);
    }

    window.setTimeout(function () {
        for (let flower of flowers) {
            removeFlower(flower);
        }

        if (afterExplode) afterExplode();
    }, time * 1000);
}

function addBombEffect(bombCell, cell, viewSize) {

    let time = gameSettings.speed * 0.5;

    let grp = new THREE.Group();
    bombCell.cellBox.add(grp);
    grp.updateMatrixWorld();

    // add some animation from the bomb to the cells
    particleSystems.push(PTFX.explode(grp, cellSize, viewSize, time, true));

    let c1 = new THREE.Vector2(0, 0);
    let c2 = new THREE.Vector2(cell.x - bombCell.x, cell.y - bombCell.y);
    let aux = new THREE.Vector2().lerpVectors(c1, c2, 0.5);

    let clip = ANIM.createCurveAnimation(c1, c2, aux);
    let action = mixer.clipAction(clip, grp);
    action.clampWhenFinished = true;
    action.setDuration(time).setLoop(THREE.LoopOnce).play();

    window.setTimeout(function () {
        mixer.uncacheRoot(grp);
        bombCell.cellBox.remove(grp);
    }, time * 1000);
}

function showRefilledcells(changedCells, afterAnim) {
    let actions = new Map();

    let time = gameSettings.speed / 4;

    let maxTime = time; // all columns
    let maxTimes = new Map(); // per column

    for (let cell of changedCells) {
        let c1 = new THREE.Vector2(cell.flower.position.x, cell.flower.position.y);
        let c2 = new THREE.Vector2(cell.x, cell.y);

        let distCells = c1.distanceTo(c2) / cellSize;
        let animTime = time * distCells;

        if (maxTimes.has(cell.col)) {
            maxTimes.set(cell.col, Math.max(maxTimes.get(cell.col), animTime));
        } else {
            maxTimes.set(cell.col, animTime);
        }

        maxTime = Math.max(maxTime, animTime);

        let aux = new THREE.Vector2().lerpVectors(c1, c2, 0.5);

        let clip = ANIM.createCurveAnimation(c1, c2, aux);
        let action = mixer.clipAction(clip, cell.flower);
        action.clampWhenFinished = true;

        actions.set(cell, { action: action, time: animTime });
    }

    let corrFac = 1 + (((maxTime / time) - 1) / (table[0].length - 1)) * 3;

    let timeFactor = (time * corrFac) / maxTime;

    // two loops needed to calulate maxTime - maybe refactor later to a better solution
    for (let cell of actions.keys()) {
        let value = actions.get(cell);
        value.action.setDuration(value.time * timeFactor).setLoop(THREE.LoopOnce).startAt(mixer.time + ((maxTimes.get(cell.col) - value.time) * timeFactor)).play();
    }

    window.setTimeout(function () {
        for (let cell of actions.keys()) {
            let action = actions.get(cell).action;
            action.stop();
            mixer.uncacheAction(action);

            cell.flower.visible = true;
            cell.flower.position.x = cell.x;
            cell.flower.position.y = cell.y;
        }

        if (afterAnim) afterAnim();

    }, maxTime * timeFactor * 1000);
}

function updateExtras(cell) {
    if (cell.extras == cellExtraType.bomb) {

        removeFlower(cell);

        let newGroup = new THREE.Group();
        cell.flower = newGroup;
        cell.flower.flowerMesh = flowerCache[bombId].clone();
        cell.flower.add(cell.flower.flowerMesh);

        initCellObject(cell, true);

        let mesh = cell.flower.flowerMesh.children[0];
        mesh.scale.x = 0;
        mesh.scale.y = 0;
        mesh.scale.z = 0;
        ANIM.blendScale(mixer, mesh, 1, gameSettings.speed / 5);

    } else {
        while(cell.flower.children.length > 1) {
            cell.flower.remove(cell.flower.children[cell.flower.children.length - 1]);
        }

        if (cell.extras && cell.extras != cellExtraType.none) {

            let radius = cellSize * 0.8 / 2;
            let geometry = new THREE.TorusGeometry(radius, radius * 0.1, 8, 12);
            let ring = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xdddddd, transparent: true, opacity: 0.85, roughness:0, metalness:0 }));
            ring.castShadow = false;
            ring.receiveShadow = false;

            ring.rotateX(Math.PI/2 - (8 * Math.PI / 180));

            if ((cell.extras & cellExtraType.horizontal) == cellExtraType.horizontal) {
                cell.flower.add(ring);
                ring = ring.clone();
            }

            if ((cell.extras & cellExtraType.vertical) == cellExtraType.vertical) {
                ring.rotateZ((8 * Math.PI / 180));
                ring.rotateY(Math.PI/2);
                cell.flower.add(ring);
            }
        }
    }
}

function setCellHighlight(cell, set) {
    if (cell) {
        let time = gameSettings.speed / 5;
        if (cell.flower.flowerMesh) {
            ANIM.blendScale(mixer, cell.flower.flowerMesh.children[0], set ? 1.25 : 1, time);
        }
        ANIM.blendProperty(mixer, cell.cellBox.material, 'emissiveIntensity', set ? 0.75 : 0, time);
    }
}

//#endregion

function checkCellIntersections() {

    if (state == gameState.play) {
        let highlightCell;
        if (gfxSettings.projection == projection.orthographic) {

            let x = ((mouse.x - tableDiv.offsetLeft) / (tableDiv.clientWidth - 0.5)) * (camera.right - camera.left) + camera.left;
            let y = ((mouse.y - tableDiv.offsetTop) / (tableDiv.clientHeight - 0.5)) * (camera.top - camera.bottom) + camera.bottom;

            let col = Math.round((x - tableOffset.x) / cellSize);
            let row = Math.round((-y - tableOffset.y) / cellSize);

            if ((col >= 0 && col < table.length) && (row >= 0 && row < table[col].length)) {
                let cell = table[col][row];
                highlightCell = cell;
            }

        } else if (gfxSettings.projection == projection.perspective) {
            /*
            if (exerciseMeshes.length > 0) {
                for (let mesh of exerciseMeshes) {
                    highlightMesh(mesh, textEmissive);
                }

                exerciseGroup.lookAt(controls.getObject().position);

                raycaster.setFromCamera({ x: mouse.x, y: mouse.y }, camera);
                var intersects = raycaster.intersectObjects(exerciseMeshes);
                if (intersects.length > 0) {
                    highlightMesh(intersects[0].object, selectedEmissive);
                    if (intersects[0].object != currentHighlight)
                    {
                        SFX.play(SFX.tickSound, true);
                        currentHighlight = intersects[0].object;
                    }
                } else {
                    currentHighlight = null;
                }

            }*/
        }
        if (currentHighlight != highlightCell) {

            if (highlightCell && highlightCell != currentSelection) {
                setCellHighlight(highlightCell, true);
            }
            if (currentHighlight && currentHighlight != currentSelection) {
                setCellHighlight(currentHighlight, false);
            }

            currentHighlight = highlightCell;
        }
    }
}

function animate() {

    if (state != gameState.paused) {
        requestAnimationFrame(animate);
        let animDelta = 0;

        // skip every second frame for lower cpu / gpu usage
        if (!skipFrame) {
            animDelta = animClock.getDelta();

            if (gfxSettings.showFPS) {
                if (fps.length > 25) fps.shift();
                fps.push(1 / animDelta);

                let currFps = 0;
                for (let idx = 0; idx < fps.length; idx++) {
                    currFps += fps[idx];
                }

                currFps = Math.round(currFps / fps.length);
                playerInfo.innerHTML = currFps + " FPS";
            }

            mixer.update(animDelta);

            particleSystems = particleSystems.filter(function (ps) {
                ps.update(animDelta);
                return !ps.removeAndDisposeIfFinished();
            });

            //scene.rotateY(0.1 * Math.PI /180);
            //scene.rotateX(0.05 * Math.PI /180);

            render();
        }
        skipFrame = !skipFrame && (animDelta < 0.04); // don't skip frames if framerate dropping below 25
    }
}

function render() {
    renderer.render(scene, camera);
}

function updatePlayerInfo() {
    if (playerInfo) {
        playerInfo.innerHTML = "";
    }
}

//#region Window resizing

function updateLayout(vertical) {

    // handle also rotation

    for (let prop of ['-webkit-box-orient', '-moz-box-orient', 'box-orient']) {
        mainDiv.style.setProperty(prop, (vertical ? 'vertical' : 'horizontal'));
    }

    let ratios = [20, 60, 20] , idx = 0;
    for (let div of [topLeftDiv, tableDiv, bottomRightDiv ]) {
        div.style.width = vertical ? '100%' : ratios[idx] + '%';
        div.style.height = vertical ? ratios[idx] + '%' : '100%';
        idx++;
    }

    let bgImageStr1 = 'linear-gradient(to ', bgImageStr2 = ', rgba(22, 22, 22, 0) 10%, rgba(22, 22, 22, 0.5))';
    topLeftDiv.style.backgroundImage = bgImageStr1 + (vertical ? 'top' : 'left') + bgImageStr2;
    bottomRightDiv.style.backgroundImage = bgImageStr1 + (vertical ? 'bottom' : 'right') + bgImageStr2;

}

function onWindowResize(update = true) {

    if (isTouch) {
        document.body.style.setProperty('height', window.innerHeight + 'px');
    }


    let res = { x: resolutions[gfxSettings.resolution].x, y: resolutions[gfxSettings.resolution].y };

    if (res.x == 0) {
        res.x = window.innerWidth;
    }
    if (res.y == 0) {
        res.y = window.innerHeight;
    }

    updateLayout(window.innerHeight > window.innerWidth);

    res.x = Math.min(res.x, tableDiv.clientWidth);
    res.y = Math.min(res.y, tableDiv.clientHeight);

    if (gfxSettings.projection == projection.orthographic) {
        let ratio = Math.max(visibleCols * cellSize / tableDiv.clientWidth, visibleRows * cellSize / tableDiv.clientHeight) / 2;
        camera.left = -ratio * tableDiv.clientWidth;
        camera.right = ratio * tableDiv.clientWidth;
        camera.top = ratio * tableDiv.clientHeight;
        camera.bottom = -ratio * tableDiv.clientHeight;
    } else if (gfxSettings.projection == projection.perspective) {
        camera.aspect = res.x / res.y;
    }

    camera.updateProjectionMatrix();

    // renderer.setPixelRatio(window.devicePixelRatio * scale);
    let scale = gfxSettings.quality;

    renderer.setSize(res.x / scale, res.y / scale, false);
    renderer.domElement.style.width = renderer.domElement.width * scale + 'px';
    renderer.domElement.style.height = renderer.domElement.height * scale + 'px';

    var style = window.getComputedStyle(renderer.domElement);
    playerInfo.style.marginLeft = style.marginLeft;
    playerInfo.style.marginTop = style.marginTop;

    playerInfo.style.fontSize = res.y / (40 - (30 * (1 - res.y / 1200))) + "px"; // non-linear scale for lower res.
    playerInfo.style.lineHeight = playerInfo.style.fontSize;

    gfxSettings.fullScreen = (window.screen.width == window.innerWidth); // API not working when triggered with F11

    if (update) {
        render();
    }

    // playerInfo.innerHTML =  window.innerWidth + " x " + window.innerHeight + " (" + window.screen.width + " x " + window.screen.height + ")";
}

//#endregion