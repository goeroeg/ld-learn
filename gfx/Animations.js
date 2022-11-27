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

export function createBlendAnimation(startValue, newValue, trackName, duration = 1) {
    var times = [0, duration], values = [startValue, newValue];
    var track = new THREE.NumberKeyframeTrack(trackName, times, values, THREE.InterpolateSmooth);
    return new THREE.AnimationClip(null, duration, [track]);
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

export function createGrowAnimation(period, start = new THREE.Vector3(0, 0, 0), target = new THREE.Vector3(1, 1, 1)) {
    var times = [0, period], values = [[start.x, target.x], [start.y, target.y], [start.z, target.z]];
    var xTrack = new THREE.NumberKeyframeTrack('.scale[x]', times, values[0]);
    var yTrack = new THREE.NumberKeyframeTrack('.scale[y]', times, values[1]);
    var zTrack = new THREE.NumberKeyframeTrack('.scale[z]', times, values[2]);
    return new THREE.AnimationClip( 'scale', period, [ xTrack, yTrack, zTrack ] );
}

export function createColorAnimation(period, startColor, endColor, propName = 'color') {
    var times = [0, period], values = [startColor.r, startColor.g, startColor.b, endColor.r, endColor.g, endColor.b];
    var colorTrack = new THREE.ColorKeyframeTrack('.' + propName, times, values, THREE.InterpolateLinear);
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


export function createCurveAnimation(origin, target, aux) {
    let path = new THREE.Path();
    path.moveTo(origin.x, origin.y);
    path.quadraticCurveTo(aux.x, aux.y, target.x, target.y);

    let times = []
    let xvalues = [];
    let yvalues = [];

    let numSeg = 3;

    for (let t = 0; t <= numSeg; t++) {
        times.push(t);
        let time = (t / numSeg);
        let point = path.getPointAt(time);

        xvalues.push(point.x);
        yvalues.push(point.y);
    }

    let xtrack = new THREE.NumberKeyframeTrack('.position[x]', times, xvalues, THREE.InterpolateSmooth);
    let ytrack = new THREE.NumberKeyframeTrack('.position[y]', times, yvalues, THREE.InterpolateSmooth);

    let vtrack = new THREE.BooleanKeyframeTrack('.visible', [0, 1], [true, true]);

    let clip = new THREE.AnimationClip('road', numSeg, [xtrack, ytrack, vtrack]);

    clip.path = path;

    return clip;
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

export function createCCWRoundedRectPath(length, width, radius) {
    let x = -length / 2;
    let z = -width / 2;

    let path = new THREE.Path();
    path.moveTo( x, z + radius );

    path.absarc( x + radius, z + radius, radius, -Math.PI, -Math.PI/2, false );
    path.absarc( -x - radius, z + radius, radius, -Math.PI/2, 0, false );
    path.absarc( -x - radius, -z - radius, radius, 0, Math.PI/2, false );
    path.absarc( x + radius, -z - radius, radius, Math.PI/2, Math.PI, false );

    path.lineTo( x, z + radius );

    //path.closePath();

    return path;
}

const corrTimeStep = 0.00005;

function clipToRange(value, min, max) {
    let step = Math.abs(max-min);

    while(value < min) { value += step; }
    while(value > max) { value -= step; }

    return value;
}

export function createPathAnimation (path, offset, wheelDist = 0) {
    let pathLen = path.getLength();

    let timeOffset = offset / pathLen;

    let wheelDelta = (wheelDist / 2) / pathLen;

    let times = []
    let xvalues = [];
    let zvalues = [];
    let rot = [];
    let numSeg = Math.ceil(pathLen / 80); // numLinTracks * 2 + 32 + 1;

    let prevAngle;

    function getValuesAt(time) {
        let p1 = path.getPointAt(clipToRange(time - wheelDelta, 0, 1));
        let p2 = path.getPointAt(clipToRange(time + wheelDelta, 0, 1));

        return {
            point: new THREE.Vector2((p1.x + p2.x) / 2, (p1.y + p2.y) / 2),
            angle: -(wheelDist == 0 ? path.getTangentAt(time).angle() : Math.atan2(p2.y - p1.y, p2.x - p1.x)) - Math.PI/2
        };
    }

    for (let t = 0; t <= numSeg; t++) {
        let time = clipToRange(t / numSeg - timeOffset, 0, 1);

        // let point = path.getPointAt(time);
        // let angle = -path.getTangentAt(time).angle();

        let values = getValuesAt(time);

        // prevent 'dancing'
        if (Math.abs(values.angle - prevAngle) > Math.PI) {
            let tempTime = time;
            let tempValues = values;
            let lastValues, lastTime;

            do { // find the tipping point
                lastValues = tempValues;
                lastTime = tempTime;

                tempTime -= corrTimeStep;
                if (tempTime < 0) tempTime += 1;

                tempValues = getValuesAt(tempTime);
            } while (Math.abs(tempValues.angle - prevAngle) > Math.PI);

            times.push((tempTime + timeOffset) * numSeg);
            times.push((lastTime + timeOffset) * numSeg);

            [tempValues, lastValues].forEach(values => {
                rot.push (values.angle);
                xvalues.push(values.point.x);
                zvalues.push(values.point.y);
            });
        }

        times.push(t);
        xvalues.push(values.point.x);
        zvalues.push(values.point.y);
        rot.push(values.angle);

        prevAngle = values.angle;
    }

    let xtrack = new THREE.NumberKeyframeTrack('.position[x]', times, xvalues);
    let ztrack = new THREE.NumberKeyframeTrack('.position[z]', times, zvalues);
    let rottrack = new THREE.NumberKeyframeTrack('.rotation[y]', times, rot);

    let clip = new THREE.AnimationClip('road', numSeg, [xtrack, ztrack, rottrack]);

    clip.path = path;

    return clip;
}

export function createTrackAnimation (numLinTracks, linTrackLength, radius, offset, wheelDist = 0) {
    let len = (numLinTracks * linTrackLength) + (radius * 2);
    return createPathAnimation(createRoundedRectPath(len, len, radius), offset, wheelDist);
}

export function createRoadAnimation(numSegments, segmentSize, radius, ccw, wheelDist = 0) {
    let len = numSegments * segmentSize;
    let path = ccw ? createCCWRoundedRectPath(len, len, radius) : createRoundedRectPath(len, len, radius);

    return createPathAnimation(path, 0, wheelDist);
}

export function blendProperty(mixer, obj, propName, targetValue, duration) {
    let currValue = obj[propName];
    mixer.uncacheRoot(obj);
    obj[propName] = currValue;

    let action = mixer.clipAction(createBlendAnimation(currValue, targetValue, '.' + propName), obj);
    action.clampWhenFinished = true;
    action.setLoop(THREE.LoopOnce).setDuration(duration).play();
}

export function blendColor(mixer, obj, targetColorHex, duration, propName = 'color') {
    let currColor = obj[propName];

    mixer.uncacheRoot(obj);

    let action = mixer.clipAction(createColorAnimation(duration, currColor, new THREE.Color(targetColorHex), propName), obj);
    action.clampWhenFinished = true;
    action.setLoop(THREE.LoopOnce).play();
    obj[propName].setHex(targetColorHex);
}

export function blendScale(mixer, obj, targetValue, duration) {

    let currScale = new THREE.Vector3(obj.scale.x, obj.scale.y, obj.scale.z);
    let targetScale = new THREE.Vector3(targetValue, targetValue, targetValue);

    mixer.uncacheRoot(obj);
    obj.scale.x = currScale.x;
    obj.scale.y = currScale.y;
    obj.scale.z = currScale.z;

    let action = mixer.clipAction(createGrowAnimation(1, currScale, targetScale), obj);
    action.clampWhenFinished = true;
    action.setLoop(THREE.LoopOnce).setDuration(duration).play();
}