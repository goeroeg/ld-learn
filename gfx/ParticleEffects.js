import '../web_modules/partykals/dist/partykals.js';
import * as WORLD from './World.js';

const size = WORLD.plateCounter * WORLD.plateSize;

export const ptfxType = {
    none: 0,
    rain: 1,
    snow: 2,
    stars: 3,
    sstars: 4,
    fireflies: 5,
    parcel: 6
}

export const starsTtl = 10;

export function letItSnow(scene, intensity = 1.0, wind) {

    var tex = new THREE.TextureLoader().load( './gfx/textures/snowflake2.png' );

    let system = new Partykals.ParticlesSystem({
        container: scene,
        particles: {
            globalSize: 8,
            texture: tex,            
            alpha: 1,
            blending: 'additive',         
            ttl: 12,
            velocity: new Partykals.Randomizers.SphereRandomizer(50),
            velocityBonus: new THREE.Vector3(0, -25, 0).add(wind || new THREE.Vector3(10,0,10)),
            gravity: -10,
            offset: new Partykals.Randomizers.BoxRandomizer(new THREE.Vector3(-size, 800, -size), new THREE.Vector3(size, 1000, size)),
            globalColor: new THREE.Color(0x555555)
        },
        system: {
            particlesCount: 20000 * intensity,
            emitters: new Partykals.Emitter({                
                onInterval: new Partykals.Randomizers.MinMaxRandomizer(5 * intensity, 15 * intensity),
                interval: 0.01, //new Partykals.Randomizers.MinMaxRandomizer(0, 0.25),
                detoretingMinTtl: 5
            }),
            speed: 1,
            perspective: true,
            scale: 500
        }
    });

    system.type = ptfxType.snow;

    return system;
}

export function letItRain(scene, intensity = 1.0, wind) {

    var tex = new THREE.TextureLoader().load( './gfx/textures/raindrop.png' );

    let system = new Partykals.ParticlesSystem({
        container: scene,
        particles: {
            globalSize: 6,
            texture: tex,            
            alpha: 1,
            blending: 'blend',         
            ttl: 1,
            velocity: 0, //new Partykals.Randomizers.SphereRandomizer(2),
            velocityBonus: new THREE.Vector3(0, -750, 0).add(wind || new THREE.Vector3(10,0,10)),
            gravity: 0,
            offset: new Partykals.Randomizers.BoxRandomizer(new THREE.Vector3(-size, 700, -size), new THREE.Vector3(size, 750, size)),
            globalColor: new THREE.Color(0x888899)
        },
        system: {
            particlesCount: 25000 * intensity,
            emitters: new Partykals.Emitter({                
                onInterval: 250 * intensity, //new Partykals.Randomizers.MinMaxRandomizer(1500, 2500),
                interval: 0.01, //new Partykals.Randomizers.MinMaxRandomizer(0, 0.25),
                detoretingMinTtl: 5
            }),
            speed: 1,
            perspective: true,
            scale: 1200
        }
    });

    system.type = ptfxType.rain;

    return system;
}

export function fireflies(scene, intensity = 1.0) {

    var tex = new THREE.TextureLoader().load( './gfx/textures/firefly.png' );

    let system = new Partykals.ParticlesSystem({
        container: scene,
        particles: {
            globalSize: 3,
            texture: tex,
            startColor: new Partykals.Randomizers.ColorsRandomizer(new THREE.Color(0x11aa11), new THREE.Color(0x33ff88)),
            endColor: new Partykals.Randomizers.ColorsRandomizer(new THREE.Color(0x003300), new THREE.Color(0x11aa44)),
            startColorChangeAt: 0.5,                       
            startAlpha: 0,
            endAlpha: 1,
            startAlphaChangeAt : 0,
            blending: 'blend',         
            ttl: 1, 
            ttlExtra : 4,
            velocity: new Partykals.Randomizers.SphereRandomizer(30, 10, new THREE.Vector3(1, 1, 1), new THREE.Vector3(-1, -0.4, -1), new THREE.Vector3(1, 0.4, 1)),
            // velocityBonus: new THREE.Vector3(0, -750, 0),
            gravity: -3,
            offset: new Partykals.Randomizers.BoxRandomizer(new THREE.Vector3(-size, 20, -size), new THREE.Vector3(size, 100, size)),            
        },
        system: {
            particlesCount: 8000 * intensity,
            emitters: new Partykals.Emitter({                
                onInterval: new Partykals.Randomizers.MinMaxRandomizer(1000 * intensity, 4000 * intensity),
                interval: 0.5, //new Partykals.Randomizers.MinMaxRandomizer(0, 0.25),
                detoretingMinTtl: 5
            }),
            speed: 1,
            perspective: true,
            scale: 500
        }
    });
    system.type = ptfxType.fireflies;
    return system;
}

export function starsAbove(scene, intensity = 1.0) {

    let tex = new THREE.TextureLoader().load( './gfx/textures/firefly.png' );

    let system = new Partykals.ParticlesSystem({
        container: scene,
        particles: {
            globalSize: 60, // new Partykals.Randomizers.MinMaxRandomizer(15, 35),
            texture: tex,
            //alpha: 1,
            //color: new THREE.Color(0xeeeeee),
            startColor: new THREE.Color(0xffffff),
            endColor: new THREE.Color(0x222222),
            startColorChangeAt: starsTtl * 0.75,                       
            startAlpha: 0,
            endAlpha: 1,
            startAlphaChangeAt : 0,
            blending: 'blend',         
            ttl: starsTtl, 
            ttlExtra : starsTtl,
            offset: new Partykals.Randomizers.SphereRandomizer(7495, 7000) //, new THREE.Vector3(1, 1, 1), new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 1, 1))
        },
        system: {
            particlesCount: 5000 * intensity,
            emitters: new Partykals.Emitter({ 
                onSpawnBurst: 500 * intensity,               
                onInterval: new Partykals.Randomizers.MinMaxRandomizer(250 / starsTtl * intensity, 500 / starsTtl * intensity),
                interval: 1, //new Partykals.Randomizers.MinMaxRandomizer(0, 0.25),
                detoretingMinTtl: 1
            }),
            speed: 1,
            perspective: true,
            scale: 500
        }
    });

    system.type = ptfxType.stars;
    return system;
}

export function shootingStars(scene, intensity = 1.0) {
    let tex = new THREE.TextureLoader().load( './gfx/textures/firefly.png' );

    let height = 6000;
    let skysize = size * 1.5;

    let system = new Partykals.ParticlesSystem({
        container: scene,
        particles: {
            globalSize: 75, // new Partykals.Randomizers.MinMaxRandomizer(15, 35),
            texture: tex,
            //alpha: 1,
            globalColor: new THREE.Color(0xffffff),                    
            startAlpha: 0,
            endAlpha: 1,
            startAlphaChangeAt : 0,
            blending: 'blend',     
            velocity: new Partykals.Randomizers.SphereRandomizer(1800, 2200, new THREE.Vector3(1, 1, 1), new THREE.Vector3(-1, -0.1, -1), new THREE.Vector3(1, 0, 1)),    
            gravity: -300,
            ttl: 2, 
            ttlExtra : 1,
            offset: new Partykals.Randomizers.BoxRandomizer(new THREE.Vector3(-skysize, height, -skysize), new THREE.Vector3(skysize, height * 1.1, skysize)),
        },
        system: {
            particlesCount: 10 * intensity,
            emitters: new Partykals.Emitter({                    
                onInterval: 1,
                interval: 1 / intensity, //new Partykals.Randomizers.MinMaxRandomizer(0, 0.25),
                detoretingMinTtl: 1
            }),
            speed: 1,
            perspective: true,
            scale: 500
        }
    });

    system.type = ptfxType.sstars;
    return system;
}

export function generateWind(maxValue) {
    return new Partykals.Randomizers.SphereRandomizer(maxValue, 1, new THREE.Vector3(1, 1, 1), new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 0, 1)).generate();
}

export function parcelEffect(scene, x, z, height = 150, time = 10, size = WORLD.parcelSize * 0.25) {
    let tex = new THREE.TextureLoader().load( './gfx/textures/firefly.png' );

    let system = new Partykals.ParticlesSystem({
        container: scene,
        particles: {
            startSize: new Partykals.Randomizers.MinMaxRandomizer(0.1, 0.4),
            endSize: new Partykals.Randomizers.MinMaxRandomizer(0.4, 0.8),
            startSizeChangeAt: 0,
            texture: tex,
            //alpha: 1,
            color: new Partykals.Randomizers.ColorsRandomizer(new THREE.Color(0xbbbb55), new THREE.Color(0xffff99)),                   
            startAlpha: 0.75,
            endAlpha: 0,
            startAlphaChangeAt : 0,
            blending: 'blend',     
            velocity: new Partykals.Randomizers.SphereRandomizer(8, 1, new THREE.Vector3(1, 1, 1), new THREE.Vector3(-1, -0.1, -1), new THREE.Vector3(1, 0.1, 1)),    
            velocityBonus: new THREE.Vector3(0, 25, 0),
            gravity: -0.02,
            ttl: height/25,
            ttlExtra : 1,
            offset: new Partykals.Randomizers.BoxRandomizer(new THREE.Vector3(-size, 0, -size), new THREE.Vector3(size, 0, size)),
        },
        system: {
            particlesCount: 5000,
            emitters: new Partykals.Emitter({                    
                onInterval: size * 0.25,
                interval: 0.25, //new Partykals.Randomizers.MinMaxRandomizer(0, 0.25),
                detoretingMinTtl: time * 0.5,
            }),
            speed: 1,
            perspective: true,
            scale: 10000,
            ttl: time
        }
    });

    system.particleSystem.position.x = x;
    system.particleSystem.position.z = z;

    system.type = ptfxType.parcel;
    return system;
}