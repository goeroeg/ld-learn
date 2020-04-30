import * as THREE from '../node_modules/three/build/three.module.js';
import { LDrawLoader } from './LDrawLoader.js';
import * as ANIM from './Animations.js';

export const plateSize = 640;
export const parcelSize = 80;
export const plateCounter = 7;

export var worldPlates = 4.5;

export const roadPlates = worldPlates - 0.5;

export var model;

export var chrystal;

var plate;
var fence;
var plants = [];

export var plates = [];
export var parcels = [];
export var freeParcels = [];

export const smoothNormals = false; // test this later, but takes longer for testing

const fencePlaceholder = 1;
const roadPlaceholder = 2;


export function initScene(onLoad, onProgress, onError) {
    var lDrawLoader = new LDrawLoader();

    lDrawLoader.smoothNormals = smoothNormals; 

    lDrawLoader.separateObjects = true;

    lDrawLoader
        .setPath( "ldraw/" )
        .load( "models/ambient.ldr_Packed.mpd", function ( group2 ) {

            model = group2;

            // Convert from LDraw coordinates: rotate 180 degrees around OX
            model.rotateX(-Math.PI);

            // Adjust materials

            console.log(model);

            model.traverse( c => { 
                c.visible = !c.isLineSegments; 
                c.castShadow = true; 
                c.receiveShadow = true; 
            } );

            //model.castShadow = true;
            //model.receiveShadow = true;

            let max = plateSize * (plateCounter + 0.5);
            let min = -max;
            
            // create parcels
            for (let x = min; x <= max; x += parcelSize) {
                for (let z = min; z <= max; z += parcelSize) {
                    let newParcel = { x: x, z: z };
                    parcels.push(newParcel);
                }
            }
            
            plate = model.children[0];
            plate.traverse( c => { 
                c.castShadow = false; 
            } );
            plate.castShadow = false;

            fence = model.children[1];

            chrystal = model.children[2];
        
            // let plants = [];
            for (let plantIdx = 3; plantIdx < model.children.length; plantIdx++) {
                plants.push(model.children[plantIdx]);        
            }

            // clear model, keep only first plate
            while(model.children.length > 1) model.remove(model.children[1]);

            worldPlates = 0.5;
            freeParcels = parcels.filter(parcelFilter);                            

            onLoad(model);
                        
        }, onProgress, onError);
}

export function createPlates() {
    model.remove(plate);
    for (let x = -plateCounter; x <= plateCounter; x += 1) {
        for (let z = -plateCounter; z <= plateCounter; z += 1) {            
            let newPlate = plate.clone();
            newPlate.translateX(x * plateSize);
            newPlate.translateZ(z * plateSize);
            model.add(newPlate);
            plates.push(newPlate);
        }
    }
    worldPlates = 4.5;
}

function debugParcel(x, z, color = 0xffffff) {
        let mat = new THREE.MeshBasicMaterial({color: color, transparent: true, opacity:0.5});
        let geo = new THREE.BoxBufferGeometry(parcelSize, parcelSize, parcelSize);        
        let mesh = new THREE.Mesh(geo, mat);
        mesh.position.x = x;
        mesh.position.z = z;
        model.add(mesh);
}

function parcelFilter(value) { 
    /*
    // debug vis 
    if (value.occupied) {
        debugParcel(value.x, value.z);
    }
    */

    return (!value.occupied) && (Math.abs(value.x) < (plateSize * worldPlates) && Math.abs(value.z) < (plateSize * worldPlates));
}

export function createFences() {
    let max = plateSize * worldPlates;
    let min = -max;
    let x, z;
    let depth = 10;
    let width = 80;
    let step = width * 2;

    // +z
    z = max + depth;
    for (x = min + width; x <= max - width; x += step) {
        addFence(fence, x, z, true);
    }
    fence.rotateY(Math.PI);
    // -z
    z = min - depth;
    for (x = min + width; x <= max - width; x += step) {
        addFence(fence, x, z, true);
    }
    // -x
    fence.rotateY(Math.PI / 2);
    x = min - depth;
    for (z = min + width; z <= max - width; z += step) {
        addFence(fence, x, z, false);
    }
    // +x
    fence.rotateY(Math.PI);
    x = max + depth;
    for (z = min + width; z <= max - width; z += step) {
        addFence(fence, x, z, false);
    }

    freeParcels = parcels.filter(parcelFilter);

    function addFence(template, fenceX, fenceZ, xDir) {
        let newFence = template.clone();
        newFence.position.x = fenceX;
        newFence.position.z = fenceZ;

        parcels[getParcelIndex(fenceX, fenceZ)].occupied = fencePlaceholder;
        if (xDir) {
            parcels[getParcelIndex(fenceX - width, fenceZ)].occupied = fencePlaceholder;
            parcels[getParcelIndex(fenceX + width, fenceZ)].occupied = fencePlaceholder;
        } else {
            parcels[getParcelIndex(fenceX, fenceZ - width)].occupied = fencePlaceholder;
            parcels[getParcelIndex(fenceX, fenceZ + width)].occupied = fencePlaceholder;
        }

        model.add(newFence);
    }
}

export function populatePlants(min, max, mixer) {
    // populate world
    for (let plant of plants) {
        let count = min + Math.random() * (max - min);
        for (let i = 0; i < count; i++) {
            let parcelIdx = Math.round(Math.random() * (parcels.length - 1));
            let parcel = parcels[parcelIdx];
            if (!parcel.occupied) {
                let newPlant = plant.clone();
                newPlant.position.x = parcel.x;
                newPlant.position.z = parcel.z;

                newPlant.translateX(Math.floor(Math.random() * 3 - 1) * 20);
                newPlant.translateZ(Math.floor(Math.random() * 3 - 1) * 20);
                newPlant.rotateY(Math.floor(Math.random() * 4) * Math.PI);

                parcel.occupied = newPlant;

                newPlant.scale.x = 0;
                newPlant.scale.y = 0;
                newPlant.scale.z = 0;

                model.add(newPlant);

                if (mixer) {
                    // add an animation
                    let action = mixer.clipAction(ANIM.createGrowAnimation(20), newPlant);
                    action.clampWhenFinished = true;
                    action.setLoop(THREE.LoopOnce).startAt(mixer.time + i*5).play();
                }
            }
        }
    }

    freeParcels = parcels.filter(parcelFilter);
}

export function prepareRoads(mixer) {
    for (let x = -roadPlates * plateSize; x <= roadPlates * plateSize; x +=parcelSize) {
        for (let z = -roadPlates * plateSize; z <= roadPlates * plateSize; z+= 2 * roadPlates * plateSize ) {
            for (let idx = -2; idx <= 2; idx++) {
                reserveForRoad(x, z + idx * parcelSize, mixer);
            }
        }
    }

    for (let x = -roadPlates * plateSize; x <= roadPlates * plateSize; x+= 2 * roadPlates * plateSize) {
        for (let z = -roadPlates * plateSize; z <= roadPlates * plateSize; z+= parcelSize ) {
            for (let idx = -2; idx <= 2; idx++) {
                reserveForRoad(x + idx * parcelSize, z, mixer);
            }
        }
    }

    function reserveForRoad(x, z, mixer) {
        let parcel = parcels[getParcelIndex(x, z)];
        //debugParcel(parcel.x, parcel.z);
        if (parcel.occupied && parcel.occupied != roadPlaceholder) {
            model.remove(parcel.occupied);
            if (mixer) {
                mixer.uncacheRoot(parcel.occupied);                
            }
        }
        parcel.occupied = roadPlaceholder;
    }
}

export function initRoads(onLoad, onProgress, onError) {

    if (!model) return;

    var lDrawLoader = new LDrawLoader();

    lDrawLoader.smoothNormals = smoothNormals; 

    lDrawLoader.separateObjects = true;

    lDrawLoader
        .setPath( "ldraw/" )
        .load( "models/roads.ldr_Packed.mpd", function ( roads ) {

            // Convert from LDraw coordinates: rotate 180 degrees around OX
            roads.rotateX(-Math.PI);

            // Adjust materials

            roads.traverse( c => { 
                c.visible = !c.isLineSegments; 
                c.castShadow = false; 
                c.receiveShadow = true; 
            } );
            
            let curve = roads.children[0];
            let straight = roads.children[1];      

            replacePlate(curve, roadPlates * plateSize, roadPlates * plateSize);
            curve.rotateY(-Math.PI/2);
            replacePlate(curve, -roadPlates * plateSize, roadPlates * plateSize);
            curve.rotateY(-Math.PI/2);
            replacePlate(curve, -roadPlates * plateSize, -roadPlates * plateSize);
            curve.rotateY(-Math.PI/2);
            replacePlate(curve, roadPlates * plateSize, -roadPlates * plateSize);
                
            for (let x = -roadPlates; x <= roadPlates; x+= 2 * roadPlates) {
                for (let z = -roadPlates + 1; z <= roadPlates - 1; z++ ) {
                    replacePlate(straight, x * plateSize, z * plateSize)
                }
            }

            straight.rotateY(Math.PI/2);

            for (let x = -roadPlates + 1; x <= roadPlates - 1; x++) {
                for (let z = -roadPlates; z <= roadPlates; z+= 2 * roadPlates ) {
                    replacePlate(straight, x * plateSize, z * plateSize)
                }
            }

            if (onLoad) onLoad(model);
                        
        }, onProgress, onError);
}

function replacePlate(template, x, z) {
    let newPlate = template.clone();    
    newPlate.position.x = x;
    newPlate.position.z = z;
    let idx = getPlateIndex(x, z);
    model.remove(plates[idx]);
    // dispose
    plates[idx] = newPlate;
    model.add(newPlate);
}

export function getPlateIndex( x, z ) {
    return (Math.round(x / plateSize) + plateCounter) * (plateCounter * 2 + 1) +  Math.round(z / plateSize) + plateCounter;
}

export function getParcelIndex( x, z ) {
    let max = plateSize * (plateCounter + 0.5);
    return (Math.round((x + max) / parcelSize)) * (Math.round((max * 2)/parcelSize) + 1) +  Math.round((z + max) / parcelSize);
}