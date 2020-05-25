import * as WORLD from './World.js';

var mapData = [];

const transparency = 0;

const defaultColor = [255, 0, 0, transparency];
const fenceColor = [255, 0, 0, transparency];
const exerciseColor = [0, 0, 0, transparency];
const plantColor = [0, 0, 0, transparency];
const roadColor = [0, 0, 0, transparency];
const chrystalColor = [0, 0, 0, transparency];
const playerColor = [0, 0, 0, transparency];
const carColor = [0, 0, 0, transparency];


export function updateMapData(canvas) {

    let ctx = canvas.getContext("2d");
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    let mapData = ctx.getImageData( 0, 0, canvas.width, canvas.height );

    for (let pIdx = 0; pIdx < WORLD.parcels.length; pIdx++) {
        
        let mIdx = pIdx * 4;
        let color = defaultColor;

        if (WORLD.parcels[pIdx].occupied){
            color = chrystalColor;
        }

        for (let cIdx = 0; cIdx < 4; cIdx++) {
            let idx = mIdx + cIdx;
            mapData.data[idx] = color[cIdx];
        }

        // console.log(mapData);
    }
    
    ctx.putImageData(mapData, 0, 0);
}

