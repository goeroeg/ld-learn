// import * as THREE from '../node_modules/three/build/three.module.js';
import { LDrawLoader } from './LDrawLoader.js'; // use fixed - 
import * as WORLD from './World.js';
import * as ANIM from './Animations.js';

const stepBody = 0;
const stepRightLeg = 1;
const stepLeftLeg = 2;
const stepRightArm = 3;
const stepLeftArm = 4;


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

            guy.body = [];

            let lhand, rhand;

            guy.traverse( c => { 
                c.visible = !c.isLineSegments; 
                c.castShadow = true; 
                c.receiveShadow = true; 

                if (c.isMesh)
                {
                    switch (c.parent.userData.constructionStep) {
                        case stepBody :
                            guy.body.push(c);
                            /*
                            let r = Math.random();
                            let g = Math.random();
                            let b = Math.random();

                            c.material[0].color.setRGB(r,g,b);
                            */
                        break;
        
                        case stepRightLeg:                     
                            guy.rleg = c;
                            break;
                        
                        case stepLeftLeg:
                            guy.lleg = c;
                            break;

                        case stepRightArm:   
                            if (guy.rarm) {
                                rhand = c;
                            } else {
                                guy.rarm = c;
                            }
                            break;
                        
                        case stepLeftArm:   
                            if (guy.larm) {
                                lhand = c;
                            } else {
                                guy.larm = c;
                            }
                            break;
                    }
                }
            } );                        

            guy.larm.attach(lhand);
            guy.rarm.attach(rhand);

            // console.log(guy);

            if (onLoad) onLoad(guy);
                        
        }, onProgress, onError);
}