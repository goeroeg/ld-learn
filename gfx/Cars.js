// import * as THREE from '../node_modules/three/build/three.module.js';
import { LDrawLoader } from './LDrawLoader.js'; // use fixed - 
import * as WORLD from './World.js';
import * as ANIM from './Animations.js';

export const availableCarModels = 3;

const stepBody = 0;
const stepRightWheels = 1;
const stepLeftWheels = 2;
const stepFrontLights = 3;
const stepRearLights = 4;

const defaultSpeed = 0.0025;

var carCache = [];

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
                
                if (c.parent.userData.constructionStep == stepBody) {
                    car.body.push(c);

                    if (!colorChanged) {
                        let r = Math.random();
                        let g = Math.random();
                        let b = Math.random();

                        c.material[0].color.setRGB(r, g, b);
                        colorChanged = true;
                    }                
                }

                if (c.parent.userData.constructionStep == stepRightWheels) {
                    car.rWheels.push(c);
                }
                if (c.parent.userData.constructionStep == stepLeftWheels) {
                    car.lWheels.push(c);
                }
                if (c.parent.userData.constructionStep == stepFrontLights) {
                    car.fLights.push(c);
                }
                if (c.parent.userData.constructionStep == stepRearLights) {
                    car.rLights.push(c);
                }
            }
        });
    }
}