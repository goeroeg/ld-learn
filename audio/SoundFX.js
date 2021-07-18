export var listener;

var itemSounds = [];

const soundsPath = "../../audio/sounds/";

export function init(soundBuffers, callbacks, camera) {
    // create an AudioListener and add it to the camera
    listener = new THREE.AudioListener();

    if (camera) camera.add(listener);

    // load a sound and set it as the Audio object's buffer
    var audioLoader = new THREE.AudioLoader();

    for (let prop in soundBuffers) {
        let sb = soundBuffers[prop];
        audioLoader.load( soundsPath + sb.filename, function( buffer ) {
            sb.buffer = buffer;
            if (callbacks.has(sb)) {
                callbacks.get(sb)(buffer, listener);
            }
        });
    }
}

export function play(sound, restart) {
    if (sound) {
        if (sound.isPlaying) {
            if (restart) {
                sound.stop();
                sound.play();
            }
        } else {
            sound.play();
        }
    }
}

export function addItemSound(item, soundBuffer, loop, volume = 0.7, rof = 1.1, autoplay = true) {
    let sound = new THREE.PositionalAudio(listener);

    item.add(sound);
    sound.setBuffer(soundBuffer.buffer).setRefDistance(50).setDistanceModel('exponential').setRolloffFactor(rof).setLoop(loop).setVolume(volume);

    if (autoplay) {
        play(sound);
    }

    if (loop) {
        itemSounds.push(sound);
        sound.item = item;
    } else {
        item.sound = sound;
    }

    return sound;
}

export function pause() {
    for (let ms of itemSounds) {
        if (ms.isPlaying)
            ms.pause();
    }
}

export function resume() {
    for (let ms of itemSounds) {
        play(ms);
    }
}

export function setVolume(audio, volume, time) {
    if (audio) {
        let ctx = audio.context;
        if (!audio.isPlaying) audio.play();
        // audio.gain.gain.cancelAndHoldAtTime(ctx.currentTime);
        // audio.gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + time);
        audio.gain.gain.setTargetAtTime(volume, ctx.currentTime, time / 5);
    }
}