import { LDrawLoader } from './LDrawLoader.js'; // use fixed - 
import * as WORLD from './World.js';

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

const altCowHeadColor = 0x1B2A34; // black
const altCowColor = 0x543324; // brown

const altHorseColors = [altCowColor, 0x000000];

var carCache = [];

//todo: cache also for animals

export function initCow(onLoad, onProgress, onError) {

    var lDrawLoader = new LDrawLoader();
    lDrawLoader.smoothNormals = WORLD.smoothNormals; 

    lDrawLoader.separateObjects = true;

    lDrawLoader
        .setPath( "ldraw/" )        
        .load( "models/cow.ldr_Packed.mpd", function ( model ) {

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
                c.visible = !c.isLineSegments;                 

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

                c.castShadow = true; 
                c.receiveShadow = true; 
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

    var lDrawLoader = new LDrawLoader();
    lDrawLoader.smoothNormals = WORLD.smoothNormals; 

    lDrawLoader.separateObjects = true;

    lDrawLoader
        .setPath( "ldraw/" )        
        .load( "models/horse.ldr_Packed.mpd", function ( model ) {

            // console.log(model);

            // Convert from LDraw coordinates: rotate 180 degrees around OX
            // model.rotateX(Math.PI);

            let colorSelect = Math.floor(Math.random() * 3);

            // Adjust materials
            let horse = model;

            let bodyParts = [];
            let headParts = [];

            model.traverse( c => { 
                c.visible = !c.isLineSegments;                 

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

                    if (c.parent.userData.constructionStep == stepCowHorns) {      
                        headParts.push(c);                                       
                    }
                }

                c.castShadow = true; 
                c.receiveShadow = true; 
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
            let clone = carCache[index].clone();
            sortCarParts(clone);
            onLoad(clone);
        }
    } else {
        var lDrawLoader = new LDrawLoader();
        lDrawLoader.smoothNormals = WORLD.smoothNormals; 

        lDrawLoader.separateObjects = true;

        lDrawLoader
            .setPath( "ldraw/" )        
            .load( "models/car_"+ index +".ldr_Packed.mpd", function ( model ) {

                // console.log(model);

                // Convert from LDraw coordinates: rotate 180 degrees around OX
                // model.rotateX(Math.PI);
                
                let car = model; //new THREE.Group();

                car.traverse( c => { 
                    c.visible = !c.isLineSegments;
                    c.castShadow = true; 
                    c.receiveShadow = true; 
                } );
        
                carCache[index] = car;

                if (onLoad) {                     
                    let clone = car.clone();
                    sortCarParts(clone);
                    onLoad(clone);
                }
                            
            }, onProgress, onError);
    }

    function sortCarParts(car) {
        car.body = [];
        car.rWheels = [];
        car.lWheels = [];
        car.fLights = [];
        car.rLights = [];

        let matMap = new Map();

        let colorChanged = false;

        car.traverse(c => {
            if (c.isMesh) {          
                // Clone materials

                if (c.material instanceof THREE.Material) {
                    c.material = c.material.clone();
                }
                else {
                    let newMats = [];
                    for (let oldMat of c.material) {                    
                        let newMat;
                        if (matMap.has(oldMat)) {
                            newMat = matMap.get(oldMat);
                        } else {
                            newMat = oldMat.clone();
                            matMap.set(oldMat, newMat);
                        }
                        newMats.push(newMat);                                  
                    }
                    c.material = newMats;
                }
                
                if (c.parent.userData.constructionStep == stepCarBody) {
                    car.body.push(c);

                    if (!colorChanged) {
                        let r = Math.random();
                        let g = Math.random();
                        let b = Math.random();

                        c.material[0].color.setRGB(r, g, b);
                        colorChanged = true;
                    }                
                }

                if (c.parent.userData.constructionStep == stepCarRightWheels) {
                    car.rWheels.push(c);
                }
                if (c.parent.userData.constructionStep == stepCarLeftWheels) {
                    car.lWheels.push(c);
                }
                if (c.parent.userData.constructionStep == stepCarFrontLights) {
                    car.fLights.push(c);
                }
                if (c.parent.userData.constructionStep == stepCarRearLights) {
                    car.rLights.push(c);
                }
            }
        });
    }
}