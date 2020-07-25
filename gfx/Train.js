import { LDrawLoader } from './LDrawLoader.js'; // use fixed - 
import * as WORLD from './World.js';
import * as ANIM from './Animations.js';

const stepTrackSleeper = 0;
const stepTrackCurved = 1;
const stepTrackStraight = 2;

const halfLength = WORLD.plateSize / 4;

export function initTracks(numStraights, onLoad, onProgress, onError) {
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
            tempSleeper.translateZ(halfLength);
            straightTrack.attach(tempSleeper);

            // create straights
            let offset = (WORLD.plateSize / 2) + (numStraights + 3) * halfLength;
            let start = (numStraights - 1)  * halfLength;
                            
            for (let idx = 1; idx <= numStraights; idx++) {                
                let pos = -start + ((idx - 1) * halfLength * 2);

                for (let angle = 0; angle <= 4; angle++) {
                    let newTrack = straightTrack.clone();
                    newTrack.rotateY(angle * Math.PI / 2);
                    newTrack.translateX(pos);
                    newTrack.translateZ(offset);
                    track.attach(newTrack);
                }               
            }            

            let curveRadius = (WORLD.plateSize / 2) + halfLength * 3;
            let curveStepAngle = Math.PI / 8;

            // create curves
            let curve = new THREE.Group();
            let segment = new THREE.Group();

            segment.add(curvedTrack);                                   
            curvedTrack.translateZ(curveRadius);                                    
            segment.rotateY(curveStepAngle / 2 );
            sleeper.translateX(curveRadius);
            sleeper.translateZ(-halfLength);
            segment.attach(sleeper);            
            curve.attach(segment.clone());

            segment.rotateY(curveStepAngle);
            curve.attach(segment.clone());

            segment.rotateY(curveStepAngle);
            curve.attach(segment.clone());

            segment.rotateY(curveStepAngle);            
            curve.attach(segment);

            let curveOffset = numStraights * halfLength;

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

            console.log("Tracks loaded.");

            if (onLoad) onLoad();
                        
        }, onProgress, onError);
}