// import * as THREE from '../node_modules/three/build/three.module.js';

import { LDrawLoader } from './LDrawLoader.js';
import * as ANIM from './Animations.js';

export const plateSize = 640;
export const parcelSize = 80;
export const plateCounter = 7;

export var worldPlates = 4.5;

export const roadPlates = worldPlates - 0.5;

export var model;

export var chrystal;

export var sphere;

export var sky;
export var sunSphere;

export var collObjs = new Set();

var plate;
var fence;
var plantProtos = [];
var roadPlate;

export var plates = [];
export var parcels = [];
export var freeParcels = [];

export const MapObjectId = {
    none: 0,
    exercise: 1,
    fence: 2,
    road: 3,
    plant: 4,
    chrystal: 5,
    car: 6,
    animal: 7,
    msphere: 8,
    track : 9,
    train : 10
};

export const seasons = {
    auto: -1,
    spring: 0,
    summer: 1,
    autumn: 2,
    winter: 3
}

export var currentSeason = seasons.auto;

export const seasonPlateColor = [ 0x58AB41, 0x00852B, 0x91501C, 0xBCB4A5 ]; // old autumn: 0x91501C
export const seasonPlantColor = [ 0x00852B, 0x00451A, 0x77774E, 0x708E7C ];

export const smoothNormals = true; // test this later, but takes longer for testing

export const fencePlaceholder = 1;
export const roadPlaceholder = 2;
export const trackPlaceholder = 3;
export const trackDummyPlaceholder = 4;

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

            // console.log(model);

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

            // console.log(parcels);
            
            plate = model.children[0];
            plate.traverse( c => { 
                c.castShadow = false; 
            } );
            plate.castShadow = false;

            fence = model.children[1];

            chrystal = model.children[2];
            chrystal.children[0].material[0].emissive.setHex(0xffffff);
            chrystal.children[0].material[0].emissiveIntensity = 0.3;
        
            sphere = model.children[3];

            // let plants = [];
            for (let plantIdx = 4; plantIdx < model.children.length; plantIdx++) {
                plantProtos.push(model.children[plantIdx]);        
            }

            // clear model, keep only first plate
            while(model.children.length > 1) model.remove(model.children[1]);

            // reserve exercise parcel
            
            //for (let i = 0; i <= 3; i++) {
                let idx = getParcelIndex(-200, plateSize);
                let exParcel = parcels[idx];
                exParcel.occupied = true;
                exParcel.mapObjId = MapObjectId.exercise;
            //}

            worldPlates = 0.5;
            freeParcels = parcels.filter(parcelFilter);                            

            setSeasonColor(currentSeason);

            onLoad(model);
                        
        }, onProgress, onError);
}

export function setSeasonColor(season) {
    if (season != seasons.auto) {            
        if (plate) {        
            plate.children[0].material[0].color.setHex(seasonPlateColor[season]);        
            plantProtos[0].children[0].material[0].color.setHex(seasonPlantColor[season])
        }
        if (roadPlate) {
            // console.log(roadPlate);
            roadPlate.children[0].material[2].color.setHex(seasonPlateColor[season]);
        }
        currentSeason = season;
    }
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

export function debugParcel(x, z, color = 0xffffff) {
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

        occupyParcel(parcels[getParcelIndex(fenceX, fenceZ)]);
        
        if (xDir) {
            occupyParcel(parcels[getParcelIndex(fenceX - width, fenceZ)]);
            occupyParcel(parcels[getParcelIndex(fenceX + width, fenceZ)]);
        } else {
            occupyParcel(parcels[getParcelIndex(fenceX, fenceZ - width)]);
            occupyParcel(parcels[getParcelIndex(fenceX, fenceZ + width)]);
        }

        model.add(newFence);

        function occupyParcel(parcel) {
            parcel.occupied = fencePlaceholder;
            parcel.mapObjId = MapObjectId.fence;
        }
    }
}

export function populatePlants(min, max, mixer) {
    // populate world
    for (let plant of plantProtos) {
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
                newPlant.rotateY(Math.floor(Math.random() * 4) * Math.PI / 2);

                model.add(newPlant);

                addCollBox(newPlant);

                parcel.occupied = newPlant;
                parcel.mapObjId = MapObjectId.plant;

                newPlant.scale.x = 0;
                newPlant.scale.y = 0;
                newPlant.scale.z = 0;

                if (mixer) {
                    // add an animation
                    let action = mixer.clipAction(ANIM.createGrowAnimation(20), newPlant);
                    action.clampWhenFinished = true;
                    action.setLoop(THREE.LoopOnce).startAt(mixer.time + i).play();
                }
            }
        }
    }

    freeParcels = parcels.filter(parcelFilter);
}

export function prepareRoads(mixer, collObjs) {
    for (let x = -roadPlates * plateSize; x <= roadPlates * plateSize; x +=parcelSize) {
        for (let z = -roadPlates * plateSize; z <= roadPlates * plateSize; z+= 2 * roadPlates * plateSize ) {
            for (let idx = -2; idx <= 2; idx++) {
                reserveParcelAt(x, z + idx * parcelSize, mixer, roadPlaceholder, collObjs);
            }
        }
    }

    for (let x = -roadPlates * plateSize; x <= roadPlates * plateSize; x+= 2 * roadPlates * plateSize) {
        for (let z = -roadPlates * plateSize; z <= roadPlates * plateSize; z+= parcelSize ) {
            for (let idx = -2; idx <= 2; idx++) {
                reserveParcelAt(x + idx * parcelSize, z, mixer, roadPlaceholder, collObjs);
            }
        }
    }
}

// call after obj is added to model
export function addCollBox(obj) {
    let bbox = new THREE.Box3().setFromObject(obj).expandByScalar(5);
    obj.bbox = bbox;
    collObjs.add(bbox);
    // model.parent.add(new THREE.Box3Helper(bbox));
}


export function reserveParcelAt(x, z, mixer, placeHolder) {
    let parcel = parcels[getParcelIndex(x, z)];
    // debugParcel(parcel.x, parcel.z);
    if (parcel.occupied && parcel.occupied != placeHolder) {
        model.remove(parcel.occupied);
        if (mixer) {
            mixer.uncacheRoot(parcel.occupied);                
        }
        collObjs.delete(parcel.occupied.bbox);
    }
    parcel.occupied = placeHolder;
    parcel.mapObjId = MapObjectId.none;
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

            for (let parcel of parcels) {
                if (parcel.occupied == roadPlaceholder) {
                    parcel.mapObjId = MapObjectId.road;
                }

            }

            roadPlate = straight;
            setSeasonColor(currentSeason);

            if (onLoad) onLoad(roads);
                        
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

