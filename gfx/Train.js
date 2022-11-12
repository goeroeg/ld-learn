import * as OBJS from './Objects.js';
import * as WORLD from './World.js';
import * as ANIM from './Animations.js';

import { ldrawColors } from './LDrawHelper.js';

const stepTrackSleeper = 0;
const stepTrackCurved = 1;
const stepTrackStraight = 2;

const stepBody = 0;
const stepRightWheels = 1;
const stepLeftWheels = 2;
const stepWindows = 3;
const stepFrontLights = 4;
const stepRearLights = 5;
const stepHighlight = 6;

const locoColor = ldrawColors.Dark_Orange; // ldrawColors.Dark_Orange;
const waggonColor = ldrawColors.Light_Grey; // ldrawColors.Light_Grey;
const highlightColor = ldrawColors.Green; // ldrawColors.Green;

const defaultLocoIndex = 0; // 0;
const defaultWaggonIndex = 0; // 0;

export const vehicleLength =  513;
export const wheelDistance = 300;

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

export function initTracks(onLoad, onProgress, onError, effectFunc) {
    OBJS.loadModel('tracks', function ( model ) {

            let sleeper, straightTrack, curvedTrack;

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

            let count = 0;

            for (let parcel of WORLD.parcels) {
                if (parcel.occupied == WORLD.trackPlaceholder) {
                    parcel.mapObjId = WORLD.MapObjectId.track;
                    if (effectFunc && (count++ % 5 == 0)) {
                        effectFunc(parcel.x, parcel.z, 200, 15);
                    }
                }
            }

            if (onLoad) onLoad(track);

        }, onProgress, onError);
}

export function initLoco(onLoad, onProgress, onError) {
    OBJS.loadModel('loco_' + defaultLocoIndex,  function ( model ) {

        loco = new THREE.Group();
        loco.add(model);

        loco.body = model.steps[stepBody];
        loco.rWheels = model.steps[stepRightWheels];
        loco.lWheels = model.steps[stepLeftWheels];
        loco.windows = model.steps[stepWindows];
        loco.frontLights = model.steps[stepFrontLights];
        loco.rearLights = model.steps[stepRearLights];
        loco.highlightStripe = model.steps[stepHighlight];

        // Adjust materials
        let winMatMap = new Map();
        let lightsMatMap = new Map();

        loco.body.forEach(c => {
            c.material.forEach(mat => {
                if(mat.color.getHex() == ldrawColors.Main_Colour.hex) {
                    mat.color.setHex(locoColor.hex);
                }
            })
        });

        if (loco.highlightStripe.length > 0) {
            loco.highlightStripe[0].material[0].color.setHex(highlightColor.hex);
        }

        loco.windows.forEach(c => {
            OBJS.cloneMaterial(c, winMatMap);
        });

        loco.frontLights.forEach(c => {
            OBJS.cloneMaterial(c, lightsMatMap);
        });

        loco.rearLights.forEach(c => {
            OBJS.cloneMaterial(c, lightsMatMap);
        });

        if (onLoad) onLoad(loco);
    }, onProgress, onError);
}

export function initWaggon(onLoad, onProgress, onError, lastCall) {
    function cloneAndRaiseOnLoad(obj) {
        if (onLoad) {
            let clone = lastCall ? obj : OBJS.cloneModel(obj);
            sortWaggonParts(clone);
            onLoad(clone);
        }
    }

    if (waggon) {
        // already loaded
        cloneAndRaiseOnLoad(waggon);
    } else {
        OBJS.loadModel('waggon_' + defaultWaggonIndex,  function ( model ) {
            waggon = model;
            cloneAndRaiseOnLoad(waggon);
        }, onProgress, onError);
    }

    function sortWaggonParts(waggon) {
        waggon.body = waggon.steps[stepBody];
        waggon.rWheels = waggon.steps[stepRightWheels];
        waggon.lWheels = waggon.steps[stepLeftWheels];
        waggon.windows = waggon.steps[stepWindows];
        waggon.frontLights = waggon.steps[stepFrontLights];
        waggon.rearLights = waggon.steps[stepRearLights];
        waggon.highlightStripe = waggon.steps[stepHighlight];

        // Adjust materials

        waggon.body.forEach(c => {
            c.material.forEach(mat => {
                if(mat.color.getHex() == ldrawColors.Main_Colour.hex) {
                    mat.color.setHex(waggonColor.hex);
                }
            })
        });

        if (waggon.highlightStripe.length > 0) {
            waggon.highlightStripe[0].material[0].color.setHex(highlightColor.hex);
        }

        let winMatMap = new Map();
        let lightsMatMap = new Map();

        waggon.windows.forEach(c => {
            OBJS.cloneMaterial(c, winMatMap);
        });

        waggon.frontLights.forEach(c => {
            OBJS.cloneMaterial(c, lightsMatMap);
        });
        waggon.rearLights.forEach(c => {
            OBJS.cloneMaterial(c, lightsMatMap);
        });
    }
}
