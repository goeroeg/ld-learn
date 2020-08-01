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

export function initCar(index, onLoad, onProgress, onError) {

    var lDrawLoader = new LDrawLoader();
    lDrawLoader.smoothNormals = WORLD.smoothNormals; 

    lDrawLoader.separateObjects = true;

    lDrawLoader
        .setPath( "ldraw/" )        
        .load( "models/car_"+ index +".ldr_Packed.mpd", function ( model ) {

            // console.log(model);

            // Convert from LDraw coordinates: rotate 180 degrees around OX
            // model.rotateX(Math.PI);
             
            let car = new THREE.Group();
            car.body = [];
            car.rWheels = [];
            car.lWheels = [];

            car.add(model);

            // Adjust materials

            model.traverse( c => { 
                c.visible = !c.isLineSegments;                 

                if (c.isMesh)
                {
                    if (c.parent.userData.constructionStep == stepBody) {
                        car.body.push(c);
                        
                        let r = Math.random();
                        let g = Math.random();
                        let b = Math.random();

                        c.material[0].color.setRGB(r,g,b);
                    }
    
                    if (c.parent.userData.constructionStep == stepRightWheels) {                       
                        car.rWheels.push(c);                    
                    }
                    if (c.parent.userData.constructionStep == stepLeftWheels) {                       
                        car.lWheels.push(c);                    
                    }
                }

                c.castShadow = true; 
                c.receiveShadow = true; 
            } );

                                     
            if (onLoad) onLoad(car);
                        
        }, onProgress, onError);
}