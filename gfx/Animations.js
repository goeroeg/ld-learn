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

export function createBlendAnimation(startValue, newValue, trackName) {
    var times = [0, 1], values = [startValue, newValue];
    var track = new THREE.NumberKeyframeTrack(trackName, times, values);
    return new THREE.AnimationClip(null, 1, [track]);
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

export function createColorAnimation(period, startColor, endColor) {
    var times = [0, period], values = [startColor.r, startColor.g, startColor.b, endColor.r, endColor.g, endColor.b];
    var colorTrack = new THREE.ColorKeyframeTrack('.color', times, values, THREE.InterpolateLinear);
    return new THREE.AnimationClip( 'color', period, [ colorTrack ] );
}

export function createWalkAnimation(period, angle, axis) {
    var times = [0, period/4, period/2, (period/4)*3, period], values = [ 0, angle , 0, -angle , 0 ];
    axis = axis || 'x';
    var trackName = '.rotation[' + axis + ']';
    var track = new THREE.NumberKeyframeTrack(trackName, times, values);
    return new THREE.AnimationClip('walk', period, [track]);
}

export function createHeadAnimation(period, angle, axis) {
    var times = [0, period / 3, (period / 3) * 2, period], values = [ 0, angle, 0, 0];
    axis = axis || 'x';
    var trackName = '.rotation[' + axis + ']';
    var track = new THREE.NumberKeyframeTrack(trackName, times, values);
    return new THREE.AnimationClip('head', period, [track]);
}

export function createPathAnimation() {

}

export function createRoundedRectPath(length, width, radius) {
    let x = -length / 2;
    let z = -width / 2;

    let path = new THREE.Path();
    path.moveTo( x, z + radius );
    path.lineTo( x, z + length - radius );

    path.absarc( x + radius, -z - radius, radius, Math.PI, Math.PI/2, true );
    path.absarc( -x - radius, -z - radius, radius, Math.PI/2, 0, true );
    path.absarc( -x - radius, z + radius, radius, 0, -Math.PI/2, true );
    path.absarc( x + radius, z + radius, radius, -Math.PI/2, -Math.PI, true );
    
    //path.closePath();

    return path;
}

export function createRoadAnimation(numSegments, segmentSize, radius, ccw) {
    let len = numSegments * segmentSize;
    let path = createRoundedRectPath(len, len, radius);
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

const corrTimeStep = 0.00005;

export function createTrackAnimation (numLinTracks, linTrackLength, radius, offset) {
    let len = (numLinTracks * linTrackLength) + (radius * 2);
    let path = createRoundedRectPath(len, len, radius);

    let timeOffset = offset / path.getLength();

    let times = []
    let xvalues = [];
    let zvalues = [];
    let rot = [];
    let numSeg = numLinTracks * 2 + 32 + 1;
    let prevAngle = -path.getTangentAt(0).angle();

    for (let t = 0; t <= numSeg; t++) {               
        let time = t / numSeg - timeOffset;
        if (time < 0) time += 1;
        if (time > 1) time -= 1;

        let point = path.getPointAt(time);
        
        let angle = -path.getTangentAt(time).angle();

        if (Math.abs(angle - prevAngle) > Math.PI) {
            let tempTime = time;
            let tempAngle;

            do { // find the tipping point
                tempTime -= corrTimeStep;
                if (time < 0) time += 1;
                tempAngle = -path.getTangentAt(tempTime).angle();
            } while (Math.abs(tempAngle - prevAngle) > Math.PI);

            times.push((tempTime + timeOffset) * numSeg);
            rot.push (tempAngle);
            let tempPoint = path.getPointAt(tempTime);
            xvalues.push(tempPoint.x);
            zvalues.push(tempPoint.y);

            tempTime += corrTimeStep;
            if (time > 1) time -= 1;
            tempAngle = -path.getTangentAt(tempTime).angle();

            times.push((tempTime + timeOffset) * numSeg);
            rot.push(tempAngle);
            tempPoint = path.getPointAt(tempTime);
            xvalues.push(tempPoint.x);
            zvalues.push(tempPoint.y);
        }

        prevAngle = angle;

        times.push(t);
        xvalues.push(point.x);
        zvalues.push(point.y);
        rot.push(angle);
    }

    /*
    console.log(times);
    console.log(rot);
    console.log(xvalues);
    console.log(zvalues);
    */
   
    let xtrack = new THREE.NumberKeyframeTrack('.position[x]', times, xvalues);
    let ztrack = new THREE.NumberKeyframeTrack('.position[z]', times, zvalues);
    let rottrack = new THREE.NumberKeyframeTrack('.rotation[y]', times, rot);

    let clip = new THREE.AnimationClip('road', numSeg, [xtrack, ztrack, rottrack]);

    clip.path = path;

    return clip;
}

export function blendProperty(mixer, obj, propName, targetValue, duration) {
    let currValue = obj[propName];
    mixer.uncacheRoot(obj);
    obj[propName] = currValue;

    let action = mixer.clipAction(createBlendAnimation(currValue, targetValue, '.' + propName), obj);
    action.clampWhenFinished = true;
    action.setLoop(THREE.LoopOnce).setDuration(duration).play();
}

export function blendColor(mixer, obj, targetColorHex, duration) { 
    let currColor = obj.color;

    let action = mixer.clipAction(createColorAnimation(duration, currColor, new THREE.Color(targetColorHex)), obj);
    action.clampWhenFinished = true;
    action.setLoop(THREE.LoopOnce).play();
    obj.color.setHex(targetColorHex);
}