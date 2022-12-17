import '../web_modules/three/build/three.min.js';

import * as WORLD from './World.js';
import * as PTFX from './ParticleEffects.js';
import * as SFX from '../audio/SoundFX.js';
import * as ANIM from './Animations.js';

const skyTextureFilename = '../../gfx/textures/sky_day.jpg';

var particleSystems = [];
const particleEffects = { rain: null, snow: null, stars: null, shootingStars: null, fireflies: null };

const fogValues = [{ min: 0.00012, max: 0.000275 }, { min: 0.00012, max: 0.00025 }, { min: 0.00014, max: 0.0003 }, { min: 0.00016, max: 0.0004 }];
const fogColors = { day: 0xcccccc, night: 0x101015 };
var fogIntensity = 0;

var scene;
var mixer;

var soundBuffers;
var ambientSound;
var rainSound;
// var windSound;

var skyMesh;

var hemiLight;
var dirLight;

const dirLightIntensity = 0.55; //0.45
const hemiLightIntensity = 0.8; // 0.8;

export var nightLights = [];

var weatherIcon = document.getElementById('weatherIcon');

var nightMode = false;

export function isNight() {
    return nightMode;
}

export function init(newScene, newMixer, camera) {
    scene = newScene;
    mixer = newMixer;

    scene.fog =  new THREE.FogExp2( 0xcccccc, 0.00025);// new THREE.Fog(0xcccccc, 2000, 12000);// .FogExp2( 0xcccccc, 0.0003);

    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0xB97A20;  // brownish orange

    hemiLight = new THREE.HemisphereLight(skyColor, groundColor, hemiLightIntensity);
    scene.add(hemiLight);

    var loader = new THREE.TextureLoader();
    //loader.load('../../gfx/textures/panorama.jpg',
    loader.load(skyTextureFilename,
        texture => {
            var skyGeo = new THREE.SphereBufferGeometry(12 * WORLD.plateSize, 160, 160); //, 0, 2*Math.PI, 0, Math.PI/2);
            var skyMat = new THREE.MeshLambertMaterial({ map: texture, flatShading: true, emissive: 0x5555ff, emissiveIntensity: 0 }); //1
            // var skyMat = new THREE.MeshLambertMaterial({ map: texture, shading: THREE.FlatShading, emissive: 0x00 });
            skyMat.side = THREE.BackSide;
            skyMesh = new THREE.Mesh(skyGeo, skyMat);

        }, xhr => {
            console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        }, error => { console.log("An error happened" + error); });

    /*
    var light = new THREE.DirectionalLight(0x002288);
    light.position.set(-1, -1, -1);
    scene.add(light);
    */

    //var light = new THREE.AmbientLight(0x222222);
    //scene.add(light);

    initSound(camera);
}

function initSound(camera) {
    soundBuffers = {
        ambientDay: { buffer: null, filename: 'ambient_day.ogg' },
        ambientNight: { buffer: null, filename: 'ambient_night.ogg' },
        crows: { buffer: null, filename: 'crows.ogg' },
        magpie: { buffer: null, filename: 'magpie.ogg' },
        silence: { buffer: null, filename: 'silence.ogg' },
        rain: { buffer: null, filename: 'rain.ogg' },
        // wind: { buffer: null, filename: 'wind.ogg' },
    }

    let callbacks = new Map();

    callbacks.set(soundBuffers.ambientDay, function(buffer, listener) {
        ambientSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(true).setVolume(0.2);
    });

    /*
    callbacks.set(soundBuffers.wind, function(buffer) {
        windSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(true).setVolume(0);
    });
    */

    callbacks.set(soundBuffers.rain, function(buffer, listener) {
        rainSound = new THREE.Audio(listener).setBuffer(buffer).setLoop(true).setVolume(0);
    });

    SFX.init(soundBuffers, callbacks, camera);

}

export function addNightLight(light) {
    nightLights.push(light);
    light.visible = nightMode;
}

function checkAndEndWeatherEffects(ttl = 0, all = false, removeStars = true) {

    if (!nightMode || all) {
        if (particleEffects.stars) {
            //console.log("- stars" + removeStars ? " (remove)" : " (leave)")
            particleEffects.stars.ttl = ttl;
            particleEffects.stars = null;
        }
        if (particleEffects.shootingStars) {
            //console.log("- sstars")
            particleEffects.shootingStars.ttl = ttl;
            particleEffects.shootingStars = null;
        }
        if (particleEffects.fireflies) {
            //console.log("- fireflies")
            particleEffects.fireflies.ttl = ttl;
            particleEffects.fireflies = null;
        }
    } else {
        if (!(particleEffects.snow || particleEffects.rain || particleEffects.stars)) {
            //console.log("Stars " + intensity);
            particleEffects.stars = PTFX.starsAbove(scene);
            particleSystems.push(particleEffects.stars);
        }
    }

    if (particleEffects.snow && (WORLD.currentSeason == WORLD.seasons.summer || all)) {
        //console.log("- snow")
        particleEffects.snow.ttl = ttl;
        particleEffects.snow = null;
    }

    if (all && particleEffects.rain) {
        //console.log("- rain")
        particleEffects.rain.ttl = ttl;
        particleEffects.rain = null;

        SFX.setVolume(rainSound, 0, ttl + 2);
    }

    if (removeStars) {
        for (let ps of particleSystems) {
            if (ps.type == PTFX.ptfxType.stars || ps.type == PTFX.ptfxType.sstars) {
                if (!nightMode) {
                    ps.removeSelf();
                } else {
                    ps.update(PTFX.starsTtl);
                }
            }
        }
    }
}

export function toggleWeatherEffects() {

    let precipVal = Math.random();
    let precip = precipVal < 0.33 || (precipVal < 0.66 && (WORLD.currentSeason == WORLD.seasons.spring || WORLD.currentSeason == WORLD.seasons.autumn));

    let intensity = Math.round(Math.random() * 18 + 2) / 10;

    checkAndEndWeatherEffects(3, true, precip || (!nightMode));

    let wIconPath = '../../gfx/textures/weather/w_' + (nightMode ? 'night' : 'day');

    if (precip) {

        if (intensity < 0.8) {
            wIconPath += '_light';
        } else if (intensity > 1.2) {
            wIconPath += '_heavy';
        }

        if (WORLD.currentSeason != WORLD.seasons.summer &&
            ((WORLD.currentSeason == WORLD.seasons.winter && Math.random() < 0.85)
                || (intensity < 1 && Math.random() < 0.2))) {
            //snow
            //console.log("Snow " + intensity);
            particleEffects.snow = PTFX.letItSnow(scene, intensity, PTFX.generateWind(150));
            particleSystems.push(particleEffects.snow);
            wIconPath += '_snow';

        } else {
            // rain
            //console.log("Rain " + intensity);
            particleEffects.rain = PTFX.letItRain(scene, intensity, PTFX.generateWind(500));
            particleSystems.push(particleEffects.rain);

            SFX.play(rainSound, false);
            SFX.setVolume(rainSound, intensity * 0.75, 5);

            wIconPath += '_rain';
        }

    } else if (nightMode) {
        // stars
        //console.log("Stars " + intensity);
        particleEffects.stars = PTFX.starsAbove(scene, intensity);
        particleSystems.push(particleEffects.stars);

        if ((WORLD.currentSeason == WORLD.seasons.summer || WORLD.currentSeason == WORLD.seasons.spring) && Math.random() < 0.33) {
            // fireflies
            //console.log("Fireflies " + intensity);
            let fIntensity = Math.round(Math.random() * 18 + 2) / 10;
            particleEffects.fireflies = PTFX.fireflies(scene, fIntensity);
            particleSystems.push(particleEffects.fireflies);

            wIconPath += '_ff';
        }

        if (WORLD.currentSeason != WORLD.seasons.winter && Math.random() < 0.33) {
            // shooting stars
            //console.log("SStars " + intensity);
            particleEffects.shootingStars = PTFX.shootingStars(scene, intensity);
            particleSystems.push(particleEffects.shootingStars);
            wIconPath += '_sstar';
        }
    }

    if (weatherIcon) {
        weatherIcon.src = wIconPath + '.png';
    }

    ANIM.blendProperty(mixer, dirLight, 'intensity', precip ? 0.05 : dirLightIntensity, 3);

    updateFog(precip ? intensity / 2 : 0);
}

function updateFog(intensity = fogIntensity) {
    if (scene && scene.fog) {
        scene.fog.color.setHex(nightMode ? fogColors.night : fogColors.day);

        let precip = (particleEffects.rain || particleEffects.snow);
        let seasonFog = fogValues[Math.max(WORLD.currentSeason, 0)];
        let newDensity = seasonFog.min + (precip ? (seasonFog.max - seasonFog.min) * intensity : 0);

        fogIntensity = intensity;

        ANIM.blendProperty(mixer, scene.fog, "density", newDensity, 3);
    }
}

export function toggleNight() {
    const nightChangeDuration = 1;

    nightMode = !nightMode;

    if (dirLight) {
        // ANIM.blendColor(mixer, dirLight, isNight ? 0x222244 : 0xffffff, nightChangeDuration);
        dirLight.color.setHex(nightMode ? 0x222244 : 0xffffff)
    }

    if (hemiLight) {
        ANIM.blendProperty(mixer, hemiLight, 'intensity', (nightMode ? 0.075 : hemiLightIntensity), nightChangeDuration);
        // hemiLight.intensity = (isNight ? 0.075 : 0.8);// (isNight ? 0.15 : 0.8);
    }

    if (skyMesh) {
        ANIM.blendProperty(mixer, skyMesh.material, 'emissiveIntensity', (nightMode ? 0.05 : 1), nightChangeDuration);
        // skyMesh.material.emissiveIntensity = (isNight ? 0.05 : 1);// (isNight ? 0.1 : 1);
    }

    for (let light of nightLights) {
        light.visible = nightMode;
    }

    checkAndEndWeatherEffects();
    updateAmbientSound();
    updateFog();
}

export function setSeason(season) {
    if (season == WORLD.seasons.auto) {
        // determine by date
        var month = new Date().getMonth() + 1;
        if (month <= 2 || month >= 12) season = WORLD.seasons.winter;
        if (month >= 3 && month <= 5) season = WORLD.seasons.spring;
        if (month >= 6 && month <= 8 ) season = WORLD.seasons.summer;
        if (month >= 9 && month <= 11 ) season = WORLD.seasons.autumn;
    }

    WORLD.setSeasonColor(season);

    // adjust lighting a bit
    hemiLight.groundColor.setHex(0xB97A20).lerp(new THREE.Color(WORLD.seasonPlateColor[season]), 0.15);

    checkAndEndWeatherEffects();
    updateAmbientSound();
    updateFog();
}

function addSun() {
    dirLight = new THREE.DirectionalLight(0xffffff, 0); //1);
    dirLight.position.set(2500, 5000, 1000);
    dirLight.castShadow = true;
    let size = WORLD.plateSize * WORLD.plateCounter;
    dirLight.shadow.camera.left = -size;
    dirLight.shadow.camera.right = size;
    dirLight.shadow.camera.bottom = -size;
    dirLight.shadow.camera.top = size;
    dirLight.shadow.camera.near = 3800;
    dirLight.shadow.camera.far = 7800;
    dirLight.shadow.bias = 0.0001;

    // scene.add (new THREE.CameraHelper(light.shadow.camera));

    var SHADOW_MAP_WIDTH = 4096, SHADOW_MAP_HEIGHT = 4096;
    dirLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    dirLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
    scene.add(dirLight);

    ANIM.blendProperty(mixer, dirLight, 'intensity', dirLightIntensity, 3);

    //let action = mixer.clipAction(ANIM.createHighlightAnimation(1, 1), dirLight);

    let sphereGeo = new THREE.SphereBufferGeometry(250, 32, 32);
    let sphereMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffdd, emissiveIntensity: 1 , roughness: 1});
    let sphere = new THREE.Mesh(sphereGeo, sphereMat);

    sphere.position.copy(dirLight.position).normalize().multiplyScalar(11.9 * WORLD.plateSize);
    scene.add(sphere);
}

export function createSky() {
    scene.add(skyMesh);
    ANIM.blendProperty(mixer, skyMesh.material, 'emissiveIntensity', 1, 3);
    addSun();
}

export function addParticleEffect(effect) {
    particleSystems.push(effect);
}

export function updateParticleSystems(animDelta) {
    particleSystems = particleSystems.filter(function(ps) {
        ps.update(animDelta);
        return !ps.removeAndDisposeIfFinished();
    });
}

export function initAmbientSound() {
    updateAmbientSound();
    SFX.play(ambientSound);
}

export function pauseAmbientSound() {
    if (ambientSound && ambientSound.isPlaying) {
        ambientSound.pause();
    }
    if (rainSound && rainSound.isPlaying) {
        rainSound.pause();
    }
    /*
    if (windSound && windSound.isPlaying) {
        windSound.pause();
    }
    */
}

export function resumeAmbientSound(ambient) {
    if (ambient) {
        SFX.play(ambientSound);
    }

    if (particleEffects.rain) {
        SFX.play(rainSound);
    }
    // play(windSound);
}

function updateAmbientSound() {
    let sb;

    if (WORLD.currentSeason == WORLD.seasons.winter) {
        sb = nightMode ? soundBuffers.silence : soundBuffers.crows;
    } else if (WORLD.currentSeason == WORLD.seasons.autumn) {
        sb = nightMode ? soundBuffers.ambientNight : soundBuffers.magpie;
    } else {
        sb = nightMode ? soundBuffers.ambientNight : soundBuffers.ambientDay;
    }

    if (ambientSound) {
        ambientSound.setBuffer(sb.buffer);
        if (ambientSound.isPlaying) {
            ambientSound.pause();
            ambientSound.play();
        }
    }
}