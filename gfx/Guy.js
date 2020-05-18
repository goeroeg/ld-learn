// import * as THREE from '../node_modules/three/build/three.module.js';
import { LDrawLoader } from './LDrawLoader.js'; // use fixed - 
import * as WORLD from './World.js';
import * as ANIM from './Animations.js';

export const BodyParts = { Head:0, Torso:1, RightArm:2, RightHand:3, LeftArm:4, LeftHand:5, Hip:6, RightLeg:7, LeftLeg:8 };

export function initGuy(onLoad, onProgress, onError) {    

    var lDrawLoader = new LDrawLoader();

    lDrawLoader.smoothNormals = true; // WORLD.smoothNormals; 

    lDrawLoader.separateObjects = true;

    lDrawLoader
        .setPath( "ldraw/" )
        .load( "models/guy.ldr_Packed.mpd", function ( guy ) {

            // console.log(guy);

            // Convert from LDraw coordinates: rotate 180 degrees around OX
            guy.rotateX(-Math.PI);

            // Adjust materials
            let lhand, rhand;

            guy.bodyParts = new Map();

            guy.traverse( c => { 
                c.visible = !c.isLineSegments; 
                c.castShadow = true; 
                c.receiveShadow = true; 

                if (c.isMesh)
                {
                    guy.bodyParts.set(c.parent.userData.constructionStep, c);
                }
            } );                        

            guy.bodyParts.get(BodyParts.RightArm).attach(guy.bodyParts.get(BodyParts.RightHand));
            guy.bodyParts.get(BodyParts.LeftArm).attach(guy.bodyParts.get(BodyParts.LeftHand));

            // console.log(guy);

            if (onLoad) onLoad(guy);
                        
        }, onProgress, onError);
}