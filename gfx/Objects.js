import { LDrawLoader } from './LDrawLoader.js';
import { ldrawColors } from './LDrawHelper.js';

export const studSize = 20;
export const flatSize = 8;

export const availableCarModels = 4;


const stepCowBody = 0;
const stepCowHead = 1;
const stepCowHorns = 2;

const stepHorseRearLegs = 0;
const stepHorseBody = 1;
const stepHorseHead = 2;

const stepCarBody = 0;
const stepCarRightWheels = 1;
const stepCarLeftWheels = 2;
const stepCarFrontLights = 3;
const stepCarRearLights = 4;
const stepCarFigHead = 5;

const altCowHeadColor = ldrawColors.Black.hex;
const altCowColor = ldrawColors.Brown.hex;

const altHorseColors = [ldrawColors.Brown.hex, ldrawColors.Black.hex];

var carCache = [];
export var plantProtos = [];
export var fenceProto;
export var chrystalProto;
export var sphereProto;

//todo: cache also for animals

export function loadModel(name, onLoad, onProgress, onError, isBasePlate = false, hideColor = undefined) {
    var lDrawLoader = new LDrawLoader();
    lDrawLoader.smoothNormals = !isBasePlate;
    lDrawLoader.separateObjects = true;

    lDrawLoader
        .setPath( '../../ldraw/' )
        .load( 'models/packed/' + name + '.ldr_Packed.mpd', obj => {
            // Convert from LDraw coordinates: rotate 180 degrees around OX
            // obj.rotateX(-Math.PI);

            let steps = [];
            let edgeMaterial;

            obj.traverse( c => {
                c.visible = !c.isLineSegments;
                if (c.isMesh)
                {
                    c.castShadow = !isBasePlate;
                    c.receiveShadow = true;

                    if (hideColor) {
                        if (!edgeMaterial) {
                            if (c.material[0].color.getHex() == hideColor.hex) {
                                edgeMaterial = c.material[0];
                            }
                        }
                        if (c.material[0] === edgeMaterial) {
                            c.visible = false;
                        }
                    }

                    let step = c.parent.userData.constructionStep;
                    while (steps.length <= step) {
                        steps.push([]);
                    }
                    steps[step].push(c);
                }
            } );

            obj.steps = steps;

            //console.log(obj);

            if (onLoad) onLoad(obj);

        }, onProgress, onError);
}

export function cloneModel(model) {

    let clone = model.clone();
    let steps = [];

    let matMap = new Map();

    clone.traverse( c => {
        if (c.isMesh) {
            cloneMaterial(c, matMap);

            let step = c.parent.userData.constructionStep;
            if (!steps[step]) {
                steps[step] = [];
            }
            steps[step].push(c);
        }
    } );

    clone.steps = steps;

    return clone;
}

export function cloneMaterial(mesh, matMap = new Map()) {

    function mapOrCloneMaterial(oldMat) {
        let newMat;
        if (matMap.has(oldMat)) {
            newMat = matMap.get(oldMat);
        } else {
            newMat = oldMat.clone();
            matMap.set(oldMat, newMat);
        }
        return newMat;
    }

    if (mesh.material instanceof THREE.Material) {
        mesh.material = mapOrCloneMaterial(mesh.material);
    }
    else {
        mesh.material = mesh.material.map(mat => mapOrCloneMaterial(mat));
    }
}

export function initCow(onLoad, onProgress, onError) {


    loadModel('cow', function ( model ) {

            // console.log(model);

            // Convert from LDraw coordinates: rotate 180 degrees around OX
            // model.rotateX(Math.PI);

            let colorSelect = Math.floor(Math.random() * 4);

            // Adjust materials
            let cow = model;

            let horns = [];
            let headParts = [];

            let cowMat;
            let headMat;

            model.traverse( c => {
                if (c.isMesh)
                {
                    if (c.parent.userData.constructionStep == stepCowBody) {
                        if (colorSelect > 1) {
                            let idx = c.material.length > 1 ? 1 : 0;
                            if (!cowMat) {
                                let color = new THREE.Color(altCowColor);
                                cowMat = c.material[idx].clone();
                                cowMat.color = color;
                            }
                            c.material[idx] = cowMat;
                        }
                    }

                    if (c.parent.userData.constructionStep == stepCowHead) {
                        headParts.push(c);
                        if (colorSelect > 0) {
                            if (!headMat) {
                                let headColor = new THREE.Color(colorSelect % 2 > 0 ? altCowHeadColor : altCowColor);
                                headMat = c.material[2].clone();
                                headMat.color = headColor;
                            }

                            c.material[2] = headMat;
                        }
                    }
                    if (c.parent.userData.constructionStep == stepCowHorns) {
                        horns.push(c);
                    }
                }
            } );

            cow.head = headParts[0];
            // cow.attach(cow.head);
            for (let headPart of headParts) {
                if (headPart !== cow.head) {
                    cow.head.attach(headPart);
                }
            }
            for (let horn of horns) cow.head.attach(horn);

            if (onLoad) onLoad(cow);

        }, onProgress, onError);
}

export function initHorse(onLoad, onProgress, onError) {

    loadModel('horse',  function ( model ) {

            // console.log(model);

            // Convert from LDraw coordinates: rotate 180 degrees around OX
            // model.rotateX(Math.PI);

            let colorSelect = Math.floor(Math.random() * 3);

            // Adjust materials
            let horse = model;

            let bodyParts = [];
            let headParts = [];

            model.traverse( c => {

                if (c.isMesh)
                {
                    if (c.parent.userData.constructionStep == stepHorseRearLegs) {
                        if (colorSelect > 0) {
                            let color = new THREE.Color(altHorseColors[colorSelect - 1]);
                            c.material[0].color = color;
                        }
                    }

                    if (c.parent.userData.constructionStep == stepHorseBody) {
                        bodyParts.push(c);
                    }

                    if (c.parent.userData.constructionStep == stepHorseHead) {
                        headParts.push(c);
                    }
                }
            } );

            horse.body = bodyParts[0];
            for (let bodyPart of bodyParts) {
                if (bodyPart !== horse.body) {
                    horse.body.attach(bodyPart);
                }
            }

            horse.head = headParts[0];
            for (let headPart of headParts) {
                if (headPart !== horse.head) {
                    horse.head.attach(headPart);
                }
            }

            horse.body.attach(horse.head);

            if (onLoad) onLoad(horse);

        }, onProgress, onError);
}

export function initCar(index, onLoad, onProgress, onError) {
    if (carCache[index]) {
        if (onLoad) {
            let clone = cloneModel(carCache[index]);
            sortCarParts(clone);
            onLoad(clone);
        }
    } else {
        loadModel('car_' + index, function (model) {

            let car = model; //new THREE.Group();

                carCache[index] = car;

                if (onLoad) {
                    let clone = cloneModel(car);
                    sortCarParts(clone);
                    onLoad(clone);
                }

            }, onProgress, onError);
    }

    function sortCarParts(car) {
        car.body = car.steps[stepCarBody];
        car.rWheels = car.steps[stepCarRightWheels];
        car.lWheels = car.steps[stepCarLeftWheels];
        car.fLights = car.steps[stepCarFrontLights];
        car.rLights = car.steps[stepCarRearLights];
        car.figHead = car.steps[stepCarFigHead];

        let r = Math.random();
        let g = Math.random();
        let b = Math.random();

        car.body.forEach(c => {
            c.material[0].color.setRGB(r, g, b);
        });

        let lightsMatMap = new Map();
        car.fLights.forEach(c => {
            cloneMaterial(c, lightsMatMap);
        });

        car.rLights.forEach(c => {
            cloneMaterial(c, lightsMatMap);
        });

        if (car.figHead.length > 1) {
            for (let idx = 1; idx < car.figHead.length; idx++){
                car.figHead[0].attach(car.figHead[idx]);
            }
        }
    }
}

export function initAmbient(onLoad, onProgress, onError) {
    loadModel('ambient', obj => {
        // Convert from LDraw coordinates: rotate 180 degrees around OX
        //obj.rotateX(-Math.PI);

        fenceProto = obj.children[0];
        chrystalProto = obj.children[1];
        sphereProto = obj.children[2];

        for (let plantIdx = 3; plantIdx < obj.children.length; plantIdx++) {
            obj.children[plantIdx].position.x = 0;
            obj.children[plantIdx].position.z = 0;
            plantProtos.push(obj.children[plantIdx]);
        }

        let newBush = plantProtos[4].clone();
        newBush.add(plantProtos[5].clone().translateY(-flatSize));
        plantProtos.splice(6, 0, newBush);

        for (let fIdx = 8; fIdx < 12; fIdx++) {
            let newFlower = plantProtos[7].clone();
            newFlower.add(plantProtos[fIdx].clone().rotateY(Math.PI));
            plantProtos.push(newFlower);
        }

        if (onLoad) onLoad(obj);
    }, onProgress, onError);
}
