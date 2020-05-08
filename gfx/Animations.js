// import * as THREE from '../node_modules/three/build/three.module.js';

export function createRotationAnimation(period, axis) {
    var times = [0, period], values = [0, Math.PI * 2];
    axis = axis || 'y';
    var trackName = '.rotation[' + axis + ']';
    var track = new THREE.NumberKeyframeTrack(trackName, times, values);
    return new THREE.AnimationClip(null, period, [track]);
}
export function createRotationCcwAnimation(period, axis) {
    var times = [0, period], values = [0, -Math.PI * 2];
    axis = axis || 'y';
    var trackName = '.rotation[' + axis + ']';
    var track = new THREE.NumberKeyframeTrack(trackName, times, values);
    return new THREE.AnimationClip(null, period, [track]);
}

export function createHighlightAnimation(period, intensity, isMaterial) {
    var times = [0, period], values = [0, intensity];
    var trackName = isMaterial ? '.emissiveIntensity' : '.intensity';
    var track = new THREE.NumberKeyframeTrack(trackName, times, values);
    return new THREE.AnimationClip(null, period, [track]);
}

export function createFallAnimation(period, startY, targetY) {
    var times = [0, period], values = [startY, targetY];
    var trackName = '.position[y]';
    var track = new THREE.NumberKeyframeTrack(trackName, times, values);
    return new THREE.AnimationClip(null, period, [track]);
}

export function createScaleAnimation(period, axis) {
    var times = [0, period], values = [0, 1];
    axis = axis || 'y';
    var trackName = '.scale['+ axis +']';
    var track = new THREE.NumberKeyframeTrack(trackName, times, values);
    return new THREE.AnimationClip(null, period, [track]);
}

export function createGrowAnimation(period) {
    var times = [0, period], values = [0, 1];
    var xTrack = new THREE.NumberKeyframeTrack('.scale[x]', times, values);
    var yTrack = new THREE.NumberKeyframeTrack('.scale[y]', times, values);
    var zTrack = new THREE.NumberKeyframeTrack('.scale[z]', times, values);
    return new THREE.AnimationClip( 'grow', period, [ xTrack, yTrack, zTrack ] );
}

export function createWalkAnimation(period, angle, axis) {
    var times = [0, period/4, period/2, (period/4)*3, period], values = [ 0, angle , 0, -angle , 0 ];
    axis = axis || 'x';
    var trackName = '.rotation[' + axis + ']';
    var track = new THREE.NumberKeyframeTrack(trackName, times, values);
    return new THREE.AnimationClip("walk", period, [track]);
}

export function createRoadAnimation(numSegments, segmentSize, ccw) {
    
    let height = numSegments * segmentSize;
    let width = height;
    let x = -height / 2;
    let z = x;
    let radius = segmentSize / 2;

    let path = new THREE.Path();
    path.moveTo( x, z + radius );
    path.lineTo( x, z + height - radius );
    path.quadraticCurveTo( x, z + height, x + radius, z + height );
    path.lineTo( x + width - radius, z + height );
    path.quadraticCurveTo( x + width, z + height, x + width, z + height - radius );
    path.lineTo( x + width, z + radius );
    path.quadraticCurveTo( x + width, z, x + width - radius, z );
    path.lineTo( x + radius, z );
    path.quadraticCurveTo( x, z, x, z + radius );

    // 
    let times = []
    let xvalues = [];
    let zvalues = [];
    let rot = [];
    let numSeg = (numSegments - 1) * 32 + (ccw ? numSegments + 1: 0); // for ccw some more points needed for fluent anim
    for (let t = 0; t <= numSeg; t++) {        
        times.push(t);
        let time = (ccw ? numSeg - t : t) / numSeg;
        let point = path.getPointAt(time);

        xvalues.push(point.x);
        zvalues.push(point.y);

        let angle = -path.getTangentAt(time).angle() + (ccw ? Math.PI/2 : -Math.PI/2);
        if (ccw) {
            while (angle < 0) angle += Math.PI * 2;
            while (angle > 2 * Math.PI) angle -= Math.PI * 2;
        } else {
            while (angle < -Math.PI) angle += Math.PI * 2;
            while (angle > Math.PI) angle -= Math.PI * 2;
        }
        rot.push(angle);
    }

    // console.log(rot);

    let xtrack = new THREE.NumberKeyframeTrack('.position[x]', times, xvalues);
    let ztrack = new THREE.NumberKeyframeTrack('.position[z]', times, zvalues);
    let rottrack = new THREE.NumberKeyframeTrack('.rotation[y]', times, rot);

    let clip = new THREE.AnimationClip('road', numSeg, [xtrack, ztrack, rottrack]);

    clip.path = path;

    return clip;
}