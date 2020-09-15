// import * as THREE from '../node_modules/three/build/three.module.js';

// THREE.Cache.enabled = true;

const fontPath = './web_modules/three/examples/fonts/droid/droid_sans_regular.typeface.json';

var height = 20,
    size = 70,
    hover = 30,

    curveSegments = 4,

    bevelThickness = 2,
    bevelSize = 1.5,
    bevelEnabled = true,

    font = undefined;

var textsToUpdate = new Map();

var textEmissive = 0x000000;
var defaultTextColor = 0xffffff;

export var defaultTextMaterial = new THREE.MeshLambertMaterial( { color: defaultTextColor, emissive: textEmissive, emissiveIntensity : 0.5 } );

function loadFont() {

    var loader = new THREE.FontLoader();
    loader.load( fontPath, function ( response ) {

        font = response;
        
        for (let [key, value] of textsToUpdate) {
            updateText(key, value);
        }
        textsToUpdate.clear();
    } );
}

export function createText(text, callback) {

    var group = new THREE.Group();

    if (font) {
        updateText(group, {text: text, callback: callback});
    }
    else {
        textsToUpdate.set(group, {text: text, callback: callback});
        loadFont();
    }

    return group;
}

function updateText(group, updateInfo)
{

    var material = defaultTextMaterial.clone();
    /*
    var materials = [
        new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } ), // front
        new THREE.MeshPhongMaterial( { color: 0xffffff } ) // side
    ];
    */

    var textGeo = new THREE.TextGeometry( updateInfo.text, {

        font: font,

        size: size,
        height: height,
        curveSegments: curveSegments,

        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelEnabled: bevelEnabled

    } );

    textGeo.computeBoundingBox();
    textGeo.computeVertexNormals();

    var triangle = new THREE.Triangle();

    // "fix" side normals by removing z-component of normals for side faces
    // (this doesn't work well for beveled geometry as then we lose nice curvature around z-axis)

    if ( ! bevelEnabled ) {
        var triangleAreaHeuristics = 0.1 * ( height * size );

        for ( var i = 0; i < textGeo.faces.length; i ++ ) {
            var face = textGeo.faces[ i ];

            if ( face.materialIndex == 1 ) {

                for ( var j = 0; j < face.vertexNormals.length; j ++ ) {
                    face.vertexNormals[ j ].z = 0;
                    face.vertexNormals[ j ].normalize();
                }

                var va = textGeo.vertices[ face.a ];
                var vb = textGeo.vertices[ face.b ];
                var vc = textGeo.vertices[ face.c ];

                var s = triangle.set( va, vb, vc ).getArea();
                if ( s > triangleAreaHeuristics ) {
                    for ( var j = 0; j < face.vertexNormals.length; j ++ ) {
                        face.vertexNormals[ j ].copy( face.normal );
                    }
                }
            }
        }
    }

    var centerOffset = - 0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

    textGeo = new THREE.BufferGeometry().fromGeometry( textGeo );

    var textMesh1 = new THREE.Mesh( textGeo, material );

    textMesh1.position.x = centerOffset;
    textMesh1.position.y = hover;
    textMesh1.position.z = 0;

    textMesh1.rotation.x = 0;
    textMesh1.rotation.y = Math.PI * 2;

    textMesh1.castShadow = true;

    group.add( textMesh1 );

    textGeo.computeBoundingBox();

    let bbWidth = (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x) * 1.1;
    let bbHeight = (textGeo.boundingBox.max.y - textGeo.boundingBox.min.y) * 1.1;
    let bbDepth = (textGeo.boundingBox.max.z - textGeo.boundingBox.min.z) * 1.1;

    let bbMat = new THREE.MeshBasicMaterial( {color: 0xffffff, transparent:true, opacity : 0.0} );
    let bbMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(bbWidth, bbHeight, bbDepth), bbMat);
 
    
    bbMesh.position.x = textMesh1.position.x + bbWidth / 2;
    bbMesh.position.y = textMesh1.position.y + bbHeight / 2 - 2.5;
    bbMesh.position.z = textMesh1.position.z + bbDepth / 2 - 3;

    bbMesh.rotation.x = textMesh1.rotation.x;
    bbMesh.rotation.y = textMesh1.rotation.y;
    bbMesh.rotation.z = textMesh1.rotation.z;

    // bbMesh.visible = false;
    group.bbox = bbMesh;

    group.add(bbMesh);

    if (updateInfo.callback) {
        updateInfo.callback(bbMesh);
    }

    // console.log('Processed text ' + updateInfo.text);
}