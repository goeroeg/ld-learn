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

export var soundBuffers = {
    ambientDay: null,
    ambientNight: null, 
    motor: null , 
    train: null, 
    trainEngine: null,
    trainHorn: null,
    horse: null,
    cow: null
}

export function init() {
    // create an AudioListener and add it to the camera
    listener = new THREE.AudioListener();

    // load a sound and set it as the Audio object's buffer
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load( 'sounds/ambient_day.ogg', function( buffer ) {
        // create a global audio source
        soundBuffers.ambientDay = buffer;
        ambientSound = new THREE.Audio( listener );
        ambientSound.setBuffer( buffer );
        ambientSound.setLoop( true );
        ambientSound.setVolume( 0.2 );
    });

    audioLoader.load( 'sounds/ambient_night.ogg', function( buffer ) {
        // create a global audio source
        soundBuffers.ambientNight = buffer;
    });

    audioLoader.load( 'sounds/walk.ogg', function( buffer ) {        
        walkSound = new THREE.Audio( listener );
        walkSound.setBuffer( buffer );
        walkSound.setLoop( false );
        walkSound.setVolume( 0.2 );        
    });

    audioLoader.load( 'sounds/motor.ogg', function( buffer ) {     
       soundBuffers.motor = buffer;
    });

    audioLoader.load( 'sounds/train_engine.ogg', function( buffer ) {     
        soundBuffers.train = buffer;
     });

    audioLoader.load( 'sounds/train_move.ogg', function( buffer ) {     
        soundBuffers.trainEngine = buffer;
    });

    audioLoader.load( 'sounds/train_horn.ogg', function( buffer ) {     
        soundBuffers.trainHorn = buffer;
    });

    audioLoader.load( 'sounds/horse.ogg', function( buffer ) {     
        soundBuffers.horse = buffer;
    });

    audioLoader.load( 'sounds/cow.ogg', function( buffer ) {     
        soundBuffers.cow = buffer;
    });

    audioLoader.load( 'sounds/collect.ogg', function( buffer ) {        
        collectSound = new THREE.Audio( listener );
        collectSound.setBuffer( buffer );
        collectSound.setLoop( false );
        collectSound.setVolume( 0.5 );        
    });

    audioLoader.load( 'sounds/dream.ogg', function( buffer ) {        
        newItemSound = new THREE.Audio( listener );
        newItemSound.setBuffer( buffer );
        newItemSound.setLoop( false );
        newItemSound.setVolume( 0.3 );        
    });

    audioLoader.load( 'sounds/tick.ogg', function( buffer ) {        
        tickSound = new THREE.PositionalAudio( listener );
        tickSound.setBuffer( buffer );
        tickSound.setRefDistance(100);
        tickSound.setVolume( 0.8 );
    });

    audioLoader.load( 'sounds/sphere-music.ogg', function( buffer ) {        
        sphereSound = new THREE.PositionalAudio( listener );
        sphereSound.setBuffer( buffer );
        sphereSound.setRefDistance(150);
        sphereSound.setVolume( 0.8 );
        sphereSound.setLoop( true );
    });

    for (let idx = 1; idx <= 4; idx++)
    {
        audioLoader.load( 'sounds/ok_'+ idx +'.ogg', function( buffer ) {        
            let sound = new THREE.PositionalAudio( listener );
            sound.setBuffer( buffer );
            sound.setRefDistance(100);
            sound.setVolume( 1 );
            okSounds.push(sound);
        });
    }
    for (let idx = 1; idx <= 4; idx++)
    {
        audioLoader.load( 'sounds/wrong_'+ idx +'.ogg', function( buffer ) {        
            let sound = new THREE.PositionalAudio( listener );
            sound.setBuffer( buffer );
            sound.setRefDistance(100);
            sound.setVolume( 1 );
            wrongSounds.push(sound);
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

export function addItemSound(item, buffer, loop) {
    let sound = new THREE.PositionalAudio(listener);
    
    item.add(sound);    
    sound.setBuffer(buffer);
    sound.setRefDistance(50);
    sound.setLoop(loop);
    sound.setVolume(0.7);
    sound.play();
    
    if (loop) {
        itemSounds.push(sound); 
    } else {         
        item.sound = sound; 
    }

    return sound;
}

export function setAmbientSound(isNight) {
    if (ambientSound) {
        ambientSound.setBuffer(isNight ? soundBuffers.ambientNight : soundBuffers.ambientDay);
        if (ambientSound.isPlaying) {
            ambientSound.pause();
            ambientSound.play();
        }
    }
}

export function pauseSounds() {
    if (ambientSound && ambientSound.isPlaying)
        ambientSound.pause();
    if (sphereSound && sphereSound.isPlaying)
        sphereSound.pause();
    for (let ms of itemSounds) {
        if (ms.isPlaying)
            ms.pause();
    }
}

export function resumeSounds(ambient, sphere) {
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