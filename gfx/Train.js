import { LDrawLoader } from './LDrawLoader.js'; // use fixed - 
import * as WORLD from './World.js';
import * as ANIM from './Animations.js';

const stepTrackSleeper = 0;
const stepTrackCurved = 1;
const stepTrackStraight = 2;

const stepBody = 0;
const stepRightWheels = 1;
const stepLeftWheels = 2;
const stepWindows = 3;
const stepFrontLights = 4;
const stepRearLights = 5;

export const vehicleLength =  500;
const wheelDistance = 300;

export const trackHalfLength = WORLD.plateSize / 4;
export const trackCurveRadius = trackHalfLength * 5;

export const linTrackNumber = WORLD.worldPlates * 4 - 3; // * 4

var loco, waggon;

export function prepareTracks(mixer) {
    let len = linTrackNumber * 2 * trackHalfLength + 2 * trackCurveRadius;
    let offset = 1;
    for (let side = -offset; side <= offset; side += offset) {        
        let path = ANIM.createRoundedRectPath(len + trackHalfLength * side, len + trackHalfLength * side, trackCurveRadius + (trackHalfLength / 2) * side);    
        let step = WORLD.parcelSize / path.getLength() / 2;

        for (let u = 0; u <= 1; u += step) {
            let point = path.getPointAt(u);
            WORLD.reserveParcelAt(point.x, point.y, mixer, (side != 0 ? WORLD.trackPlaceholder : WORLD.trackDummyPlaceholder));
        }
    }    
}

export function initTracks(onLoad, onProgress, onError) {
    var lDrawLoader = new LDrawLoader();
    lDrawLoader.smoothNormals = WORLD.smoothNormals; 

    lDrawLoader.separateObjects = true;

    lDrawLoader
        .setPath( "ldraw/" )        
        .load( "models/tracks.ldr_Packed.mpd", function ( model ) {

            //console.log(model);

            // Convert from LDraw coordinates: rotate 180 degrees around OX
            //model.rotateX(-Math.PI);                                           

            let sleeper, straightTrack, curvedTrack;

            // Adjust materials

            for (let c of model.children) {
                switch (c.userData.constructionStep) {
                    case stepTrackSleeper:
                        sleeper = c;
                        break;
                    case stepTrackStraight:
                        straightTrack = c;
                        break;
                    case stepTrackCurved:
                        curvedTrack = c;
                        break;
                }

            }

            model.traverse( c => { 
                c.visible = !c.isLineSegments;
                c.castShadow = true; 
                c.receiveShadow = true; 
            } );            
                
            let track = new THREE.Group();

            // add a sleeper to the straight track
            let tempSleeper = sleeper;
            tempSleeper.translateZ(trackHalfLength);
            straightTrack.attach(tempSleeper);

            // create straights
            let offset = (WORLD.plateSize / 2) + (linTrackNumber + 3) * trackHalfLength;
            let start = (linTrackNumber - 1)  * trackHalfLength;
                            
            for (let idx = 1; idx <= linTrackNumber; idx++) {                
                let pos = -start + ((idx - 1) * trackHalfLength * 2);

                for (let angle = 0; angle <= 4; angle++) {
                    let newTrack = straightTrack.clone();
                    newTrack.rotateY(angle * Math.PI / 2);
                    newTrack.translateX(pos);
                    newTrack.translateZ(offset);
                    track.attach(newTrack);
                }               
            }            

            let curveStepAngle = Math.PI / 8;

            // create curves
            let curve = new THREE.Group();
            let segment = new THREE.Group();

            segment.add(curvedTrack);                                   
            curvedTrack.translateZ(trackCurveRadius);                                    
            segment.rotateY(curveStepAngle / 2 );
            sleeper.translateX(trackCurveRadius);
            sleeper.translateZ(-trackHalfLength);
            segment.attach(sleeper);            
            curve.attach(segment.clone());

            segment.rotateY(curveStepAngle);
            curve.attach(segment.clone());

            segment.rotateY(curveStepAngle);
            curve.attach(segment.clone());

            segment.rotateY(curveStepAngle);            
            curve.attach(segment);

            let curveOffset = linTrackNumber * trackHalfLength;

            let tempCurve = curve.clone();
            tempCurve.translateX(curveOffset);
            tempCurve.translateZ(curveOffset);
            track.attach(tempCurve);

            curve.rotateY(Math.PI/2);
            tempCurve = curve.clone();
            tempCurve.translateX(curveOffset);
            tempCurve.translateZ(curveOffset);
            track.attach(tempCurve);

            curve.rotateY(Math.PI/2);
            tempCurve = curve.clone();
            tempCurve.translateX(curveOffset);
            tempCurve.translateZ(curveOffset);
            track.attach(tempCurve);

            curve.rotateY(Math.PI/2);
            tempCurve = curve;
            tempCurve.translateX(curveOffset);
            tempCurve.translateZ(curveOffset);
            track.attach(tempCurve);

            WORLD.model.add(track);

            for (let parcel of WORLD.parcels) {
                if (parcel.occupied == WORLD.trackPlaceholder) {
                    parcel.mapObjId = WORLD.MapObjectId.track;
                }
            }

            if (onLoad) onLoad(track);
                        
        }, onProgress, onError);
}

export function initLoco(onLoad, onProgress, onError) {
    var lDrawLoader = new LDrawLoader();
    lDrawLoader.smoothNormals = WORLD.smoothNormals; 

    lDrawLoader.separateObjects = true;

    lDrawLoader
        .setPath( "ldraw/" )        
        .load( "models/train.ldr_Packed.mpd", function ( model ) {

            //console.log(model);

            // Convert from LDraw coordinates: rotate 180 degrees around OX
            //model.rotateX(-Math.PI);                                           

            loco = new THREE.Group();
            loco.add(model);

            loco.body = [];
            loco.rWheels = [];
            loco.lWheels = [];
            loco.windows = [];
            loco.frontLights = [];
            loco.rearLights = [];

            // Adjust materials

            model.traverse( c => { 
                c.visible = !c.isLineSegments;                 

                if (c.isMesh)
                {
                    switch (c.parent.userData.constructionStep) {
                        case stepBody:
                            loco.body.push(c);
                            break;
                        case stepRightWheels:
                            loco.rWheels.push(c);
                            break;
                        case stepLeftWheels:
                            loco.lWheels.push(c);
                            break;
                        case stepWindows:
                            loco.windows.push(c);
                            break;
                        case stepFrontLights:
                            loco.frontLights.push(c);
                            break;
                        case stepRearLights:
                            loco.rearLights.push(c);
                            break;
                    }
                }

                c.castShadow = true; 
                c.receiveShadow = true; 
            } ); 

            let flmat;
            for (let mesh of loco.frontLights) {
                if (!flmat) flmat = mesh.material[0].clone();
                mesh.material[0] = flmat;
            }

            let wmat;
            for (let mesh of loco.windows) {
                if (!wmat) wmat = mesh.material[0].clone();
                mesh.material[0] = wmat;
            }

            if (onLoad) onLoad(loco);
        });
}

export function initWaggon(onLoad, onProgress, onError, lastCall) {
    if (waggon) {
        // already loaded
        if (onLoad) {
            if (!lastCall) {
                let clone = waggon.clone();
                sortWaggonParts(clone);
                onLoad(clone); 
            } else {
                sortWaggonParts(waggon);
                if (onLoad) onLoad(waggon); 
            }
        }
    } else {

        var lDrawLoader = new LDrawLoader();
        lDrawLoader.smoothNormals = WORLD.smoothNormals; 

        lDrawLoader.separateObjects = true;

        lDrawLoader
            .setPath( "ldraw/" )        
            .load( "models/waggon.ldr_Packed.mpd", function ( model ) {

                //console.log(model);

                // Convert from LDraw coordinates: rotate 180 degrees around OX
                //model.rotateX(-Math.PI);                                           

                model.traverse( c => { 
                    c.visible = !c.isLineSegments;
                    c.castShadow = true; 
                    c.receiveShadow = true; 
                } );            

                waggon = model;

                if (onLoad) {
                    if (!lastCall) {
                        let clone = waggon.clone();
                        sortWaggonParts(clone);
                        onLoad(clone); 
                    } else {
                        sortWaggonParts(waggon);
                        onLoad(waggon); 
                    }
                }
            });
    }

    function sortWaggonParts(group) {
        group.body = [];
        group.rWheels = [];
        group.lWheels = [];
        group.windows = [];
        group.frontLights = [];
        group.rearLights = [];

        // Adjust materials
        group.traverse(c => {
            if (c.isMesh) {
                switch (c.parent.userData.constructionStep) {
                    case stepBody:
                        group.body.push(c);
                        break;
                    case stepRightWheels:
                        group.rWheels.push(c);
                        break;
                    case stepLeftWheels:
                        group.lWheels.push(c);
                        break;
                    case stepWindows:
                        group.windows.push(c);
                        break;
                }
            }
        });
    }
}
