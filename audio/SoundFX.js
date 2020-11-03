export var listener;
export var ambientSound;
export var rainSound;
// export var windSound;
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
    crows: { buffer: null, filename: 'crows.ogg' },
    magpie: { buffer: null, filename: 'magpie.ogg' },
    silence: { buffer: null, filename: 'silence.ogg' },
    rain: { buffer: null, filename: 'rain.ogg' },
    // wind: { buffer: null, filename: 'wind.ogg' },
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

export function init(camera) {
    // create an AudioListener and add it to the camera
    listener = new THREE.AudioListener();

    if (camera) camera.add(listener);

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
        tickSound = new THREE.PositionalAudio(listener).setBuffer(buffer).setRefDistance(100).setVolume(0.8);
    });

    callbacks.set(soundBuffers.sphere, function(buffer) {
        sphereSound = new THREE.PositionalAudio(listener).setBuffer(buffer).setLoop(true).setRefDistance(150).setVolume(0.8);
    });

    /*
    callbacks.set(soundBuffers.wind, function(buffer) {
        windSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(true).setVolume(0);
    });
    */

    callbacks.set(soundBuffers.rain, function(buffer) {
        rainSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(true).setVolume(0);
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

export function setAmbientSound(sb) {
    if (ambientSound) {
        ambientSound.setBuffer(sb.buffer);
        if (ambientSound.isPlaying) {
            ambientSound.pause();
            ambientSound.play();
        }
    }
}

export function pause() {
    if (ambientSound && ambientSound.isPlaying) {
        ambientSound.pause();
    }
    if (sphereSound && sphereSound.isPlaying) {
        sphereSound.pause();
    }
    if (rainSound && rainSound.isPlaying) {
        rainSound.pause();
    }
    /*
    if (windSound && windSound.isPlaying) {
        windSound.pause();
    }
    */
    for (let ms of itemSounds) {
        if (ms.isPlaying)
            ms.pause();
    }
}

export function resume(ambient, sphere) {
    if (ambient) {
        play(ambientSound);
        play(rainSound);
        // play(windSound);    
    }
    if (sphere) {
        play(sphereSound);
    }    

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