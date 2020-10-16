export var listener;
export var ambientSound;
export var sphereSound;
export var walkSound;
export var tickSound;
export var collectSound;
export var newItemSound;
export var okSounds = [];
export var wrongSounds = [];

var itemSounds = [];

const soundsPath = "./audio/sounds/";

export var soundBuffers = {
    ambientDay: { buffer: null, filename: 'ambient_day.ogg' },
    ambientNight: { buffer: null, filename: 'ambient_night.ogg' }, 
    walk: { buffer: null, filename: 'walk.ogg' },
    collect: { buffer: null, filename: 'collect.ogg' },
    newItem: { buffer: null, filename: 'dream.ogg' },
    tick: { buffer: null, filename: 'tick.ogg' },
    motor: { buffer: null, filename: 'motor.ogg' } , 
    train: { buffer: null, filename: 'train_move.ogg' }, 
    trainEngine: { buffer: null, filename: 'train_engine.ogg' },
    trainHorn: { buffer: null, filename: 'train_horn.ogg' },
    horse: { buffer: null, filename: 'horse.ogg' },
    cow: { buffer: null, filename: 'cow.ogg' }, 
    sphere: { buffer: null, filename: 'sphere-music.ogg' }
}

export function init() {
    // create an AudioListener and add it to the camera
    listener = new THREE.AudioListener();

    // load a sound and set it as the Audio object's buffer
    var audioLoader = new THREE.AudioLoader();

    let callbacks = new Map();

    callbacks.set(soundBuffers.ambientDay, function(buffer) {
        ambientSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(true).setVolume(0.2);
    });

    callbacks.set(soundBuffers.walk, function(buffer) {
        walkSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(false).setVolume(0.2);
    });

    callbacks.set(soundBuffers.collect, function(buffer) {
        collectSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(false).setVolume(0.5);
    });

    callbacks.set(soundBuffers.newItem, function(buffer) {
        newItemSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(false).setVolume(0.3);
    });

    callbacks.set(soundBuffers.tick, function(buffer) {
        tickSound = new THREE.Audio(listener).setBuffer(buffer).setRefDistance(100).setVolume(0.8);
    });

    callbacks.set(soundBuffers.sphere, function(buffer) {
        tickSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(true).setRefDistance(150).setVolume(0.8);
    });

    for (let prop in soundBuffers) {
        let sb = soundBuffers[prop];
        audioLoader.load( soundsPath + sb.filename, function( buffer ) {
            sb.buffer = buffer;
            if (callbacks.has(sb)) {
                callbacks.get(sb)(buffer);                
            }
        });
    }

    for (let idx = 1; idx <= 4; idx++)
    {
        audioLoader.load( soundsPath + 'ok_'+ idx +'.ogg', function(buffer) {        
            okSounds.push(new THREE.PositionalAudio(listener).setBuffer(buffer).setRefDistance(100).setVolume(1));
        });
    }
    for (let idx = 1; idx <= 4; idx++)
    {
        audioLoader.load( soundsPath + 'wrong_'+ idx +'.ogg', function(buffer) {        
            wrongSounds.push(new THREE.PositionalAudio(listener).setBuffer(buffer).setRefDistance(100).setVolume(1));
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

export function addItemSound(item, soundBuffer, loop, volume = 0.7) {
    let sound = new THREE.PositionalAudio(listener);
    
    item.add(sound);    
    sound.setBuffer(soundBuffer.buffer).setRefDistance(50).setLoop(loop).setVolume(volume).play();
    
    if (loop) {
        itemSounds.push(sound); 
    } else {         
        item.sound = sound; 
    }

    return sound;
}

export function setAmbientSound(isNight) {
    if (ambientSound) {
        ambientSound.setBuffer(isNight ? soundBuffers.ambientNight.buffer : soundBuffers.ambientDay.buffer);
        if (ambientSound.isPlaying) {
            ambientSound.pause();
            ambientSound.play();
        }
    }
}

export function pause() {
    if (ambientSound && ambientSound.isPlaying)
        ambientSound.pause();
    if (sphereSound && sphereSound.isPlaying)
        sphereSound.pause();
    for (let ms of itemSounds) {
        if (ms.isPlaying)
            ms.pause();
    }
}

export function resume(ambient, sphere) {
    if (ambient) {
        play(ambientSound);
    }
    if (sphere) {
        play(sphereSound);
    }

    for (let ms of itemSounds) {
        play(ms);
    }
}