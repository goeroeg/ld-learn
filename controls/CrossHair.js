// import * as THREE from '../node_modules/three/build/three.module.js';

export function addCrossHair(camera) {
    let material = new THREE.LineBasicMaterial({ color: 0xaabb99, linewidth: 1.5 });
    // crosshair size
    let x = 0.02, y = 0.02; // 0.01
    let geometry = new THREE.Geometry();
    // crosshair
    geometry.vertices.push(new THREE.Vector3(0, y, 0));
    geometry.vertices.push(new THREE.Vector3(0, -y, 0));
    geometry.vertices.push(new THREE.Vector3(0, 0, 0));
    geometry.vertices.push(new THREE.Vector3(x, 0, 0));
    geometry.vertices.push(new THREE.Vector3(-x, 0, 0));
    let crosshair = new THREE.Line(geometry, material);
    // place it in the center
    let crosshairPercentX = 50;
    let crosshairPercentY = 50;
    let crosshairPositionX = (crosshairPercentX / 100) * 2 - 1;
    let crosshairPositionY = (crosshairPercentY / 100) * 2 - 1;
    crosshair.position.x = crosshairPositionX * camera.aspect;
    crosshair.position.y = crosshairPositionY;
    crosshair.position.z = -1;
    camera.add(crosshair);
}
