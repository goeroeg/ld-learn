import * as WORLD from './World.js';

var mapData = [];

const transparency = 240;

const defaultColor = [0, 133, 43, transparency];    //#00852B
const fenceColor = [84, 51, 36, transparency];       //#543324
const exerciseColor = [200, 180, 0, transparency];
const plantColor = [0, 69, 26, transparency];         //#00451A
const roadColor = [180, 180, 180, transparency];
const trackColor = [210, 210, 210, transparency];
const chrystalColor = [250, 250, 250, transparency];
const playerColor = [250, 200, 10, transparency];        //#FAC80A
const carColor = [60, 60, 60, transparency];
const animalsColor = [140, 90, 60, transparency];
const msphereColor = [255, 158, 43, transparency]; //#FF800D
const trainColor = [40, 10, 10, transparency];

const mapObjColors = [ 
    defaultColor, 
    exerciseColor, 
    fenceColor, 
    roadColor,
    plantColor, 
    chrystalColor, 
    carColor, 
    animalsColor,
    msphereColor,
    trackColor,
    trainColor
];

var imgWidth = (WORLD.plateCounter * 2 + 1) * WORLD.plateSize / WORLD.parcelSize + 1;
var imgHeight = (WORLD.plateCounter * 2 + 1) * WORLD.plateSize / WORLD.parcelSize + 1;

const mag = 1.2;

export function updateMiniMapColors(newPlateColor, newPlantColor) {
    let color = new THREE.Color(newPlateColor);
    mapObjColors[0][0] = color.r * 255;
    mapObjColors[0][1] = color.g * 255;
    mapObjColors[0][2] = color.b * 255;
    color = new THREE.Color(newPlantColor);
    mapObjColors[4][0] = color.r * 255;
    mapObjColors[4][1] = color.g * 255;
    mapObjColors[4][2] = color.b * 255;
    // console.log(mapObjColors);
}

export function updateMapData(canvas, ori, x, y) {

    let tempc = document.createElement('canvas');
    tempc.width = imgWidth;
    tempc.height = imgHeight;
    
    let tempctx = tempc.getContext("2d");

    let mapData = tempctx.getImageData( 0, 0, imgWidth, imgHeight );

    for (let pIdx = 0; pIdx < WORLD.parcels.length; pIdx++) {
        
        let mIdx = pIdx * 4;
        let color = defaultColor;

        if (WORLD.parcels[pIdx].occupied) {
            color = mapObjColors[WORLD.parcels[pIdx].mapObjId];
        }

        for (let cIdx = 0; cIdx < 4; cIdx++) {
            let idx = mIdx + cIdx;
            mapData.data[idx] = color[cIdx];
        }
    }
    
    tempctx.putImageData(mapData, 0, 0);

    let cwh = canvas.width / 2;
    let chh = canvas.height / 2;

    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(cwh, chh);
    ctx.rotate(ori);
    ctx.drawImage(tempc, x, y, imgWidth, imgHeight, -cwh * mag, -chh * mag, canvas.width * mag, canvas.height * mag);

    // Reset transformation matrix to the identity matrix
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // player origin
    ctx.fillStyle = 'rgba(' + playerColor[0] + ', ' + playerColor[1] + ', ' + playerColor[2] + ', ' + playerColor[3] / 255 + ')'
    ctx.beginPath();
    ctx.moveTo(cwh + 2, chh + 5);
    ctx.lineTo(cwh, chh);
    ctx.lineTo(cwh - 2, chh + 5);
    ctx.closePath();
    ctx.fill();

    // crop to circle
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(cwh, chh, chh - 2, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over'; //default
    ctx.strokeStyle = 'rgba(200, 200, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

