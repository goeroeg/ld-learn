import * as OBJS from '../../gfx/Objects.js'
import { ldrawColors } from '../../gfx/LDrawHelper.js';

export const cellSize = OBJS.studSize * 4;

const modelWhiteColor = ldrawColors.White.hex;
const modelBlackColor = ldrawColors.Black.hex;
const modelTableColor = ldrawColors.Light_Grey.hex

// color hex values
export const colors = { whiteColor: ldrawColors.White.hex,
                        blackColor: ldrawColors.Black.hex,
                        whiteCellColor: ldrawColors.Light_Nougat.hex,
                        blackCellColor: ldrawColors.Dark_Nougat.hex,
                        tableColor: ldrawColors.Nougat.hex };

const cellLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const figLetters = [['C', 'c'], ['P', 'p'], ['R', 'r'], ['N', 'n'], ['B', 'b'], ['Q', 'q'], ['K', 'k']];

/*
Piece 	White 	Black
Pawn 	P 	p
Rook 	R 	r
Knight 	N 	n
Bishop 	B 	b
Queen 	Q 	q
King 	K 	k
*/

const chessSteps = {
    base: 0,
    frame: 1,
    cell: 0,
    pawn: 1,
    rook: 2,
    knight: 3,
    bishop: 4,
    queen: 5,
    king: 6
};

const templates = {
    base: null,
    frame: null
    // will be filled
}

export const cells = {};

export function load(onLoad, onProgress, onError) {

    OBJS.loadModel('chess_base', function(baseModel) {

        baseModel.rotateX(-Math.PI);

        templates.base = new THREE.Group();
        baseModel.steps[chessSteps.base].forEach(c => templates.base.attach(c));

        templates.frame = new THREE.Group();
        baseModel.steps[chessSteps.frame].forEach(c => templates.frame.attach(c));

        OBJS.loadModel('chess', function(model) {

            model.rotateX(-Math.PI);

            function initTemplates(step) {
                let obj = new THREE.Group();
                model.steps[step].forEach(c => obj.attach(c));

                templates[figLetters[step][0]] = obj; // white

                obj = OBJS.cloneModel(obj);
                obj.rotateY(Math.PI);

                // reverse white & black
                updateBWColors(obj, modelBlackColor, modelWhiteColor);

                templates[figLetters[step][1]] = obj; // black
            }

            initTemplates(chessSteps.cell);
            templates[figLetters[chessSteps.cell][1]].rotateY (Math.PI/2);

            initTemplates(chessSteps.pawn);
            initTemplates(chessSteps.rook);
            initTemplates(chessSteps.knight);
            initTemplates(chessSteps.bishop);
            initTemplates(chessSteps.queen);
            initTemplates(chessSteps.king);

            // console.log(templates);

            if (onLoad) onLoad(model);
        }, onProgress, onError, false);

    }, onProgress, onError, true);
}

function updateModelColor(obj, modelColor, newColor)
{
    let matCache = [];
    obj.traverse(c => {
        if (c.isMesh) {
            c.material.forEach(m => {
                if (m.color.getHex() == modelColor) {
                    matCache.push(m);
                }
            });
        }
    });

    matCache.forEach(m => {
        m.color.setHex(newColor);
    });
}

function updateBWColors(obj, whiteColor, blackColor) {
    let whiteMat = [];
    let blackMat = [];

    obj.traverse(c => {
        if (c.isMesh) {
            c.material.forEach(m => {
                if (m.color.getHex() == modelWhiteColor) {
                    whiteMat.push(m);
                } else if (m.color.getHex() == modelBlackColor) {
                    blackMat.push(m);
                }
            });
        }
    });

    whiteMat.forEach(m => {
        m.color.setHex(whiteColor);
    });
    blackMat.forEach(m => {
        m.color.setHex(blackColor);
    });
}

export function createTable(scene) {

    let table = new THREE.Group();

    let base = OBJS.cloneModel(templates.base);
    let frame = OBJS.cloneModel(templates.frame);

    updateModelColor(base, modelTableColor, colors.tableColor);
    updateModelColor(frame, modelTableColor, colors.tableColor);

    table.add(base);
    table.add(frame);

    let counter = 1;
    let start = OBJS.studSize * (-14);

    for (let row=0; row < 8; row++) {
        for (let col=0; col < 8; col++) {
            let newCell = OBJS.cloneModel(templates[figLetters[chessSteps.cell][counter++ % 2]]);
            newCell.position.x = start + col * OBJS.studSize * 4;
            newCell.position.z = -start - row * OBJS.studSize * 4;

            if (colors.whiteCellColor != modelWhiteColor || colors.blackCellColor != modelBlackColor) {
                updateBWColors(newCell, colors.whiteCellColor, colors.blackCellColor);
            }

            let cellId = cellLetters[col] + (row + 1);

            let boxGeo = new THREE.BoxGeometry(OBJS.studSize * 4, 8, OBJS.studSize * 4);
            let boxMesh = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial( { color: 0xff00000 , transparent: true, opacity: 0 } ));

/*
            let edgeGeo = new THREE.EdgesGeometry(boxGeo);
            let line = new THREE.LineSegments( edgeGeo, new THREE.LineBasicMaterial( { color: 0xff00000 , linewidth: 1} ) );
            line.translateY(-4);
            line.visible = false;
*/
            boxMesh.translateY(-3);
            boxMesh.visible = true;
            newCell.add(boxMesh);

            // newCell.add(line);

            let cell = { id: cellId, position: newCell.position, figure: null, parts: newCell, box: boxMesh };

            cells[cellId] = cell;
            newCell.cell = cell;


            table.add(newCell);
        }
        counter++;
    }

    scene.add(table);
}

export function clearTable() {
    for(let cellProp in cells) {
        clearCell(cells[cellProp]);
    }
}

export function clearCell(cell) {
    let bufGeos = [];

    if (cell && cell.figure) {
        let fig = cell.figure;

        cell.figure = null;
        if (fig.parent) {
            fig.parent.remove(fig);
        }

        fig.cell = undefined;

        fig.traverse(c => {
            if (c.isMesh && c.geometry.isBufferGeometry) {
                bufGeos.push(c.geometry);
            }
        });
    }

    bufGeos.forEach(bg => { bg.dispose(); });
}

export function initFigure(cell, name, scene) {
    let fig = OBJS.cloneModel(templates[name]);
    fig.position.copy(cell.position);

    if (colors.whiteColor != modelBlackColor || colors.blackColor != modelBlackColor) {
        updateBWColors(fig, colors.whiteColor, colors.blackColor);
    }

    cell.figure = fig;

    fig.name = name;

    fig.cell = cell;

    scene.add(fig);
}

export function initFigures(pieces, scene) {
    for (let cell in pieces) {
        initFigure(cells[cell], pieces[cell], scene);
    }
}