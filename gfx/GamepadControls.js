// import * as THREE from '../node_modules/three/build/three.module.js';

/**
 * @author spite / https://github.com/spite - modified
 */
/*global THREE, console */

class GamepadControls extends THREE.EventDispatcher {

  	constructor(object) {
		super();
		this.rotMatrix = new THREE.Matrix4();
		this.dir = new THREE.Vector3( 0, 0, 1 );
		this.tmpVector = new THREE.Vector3();
		this.object = object;
		this.lon = -90;
		this.lat = 0;
		this.target = new THREE.Vector3();
		this.threshold = .15; // .05
	
		this.init();
	}

	init() {

		var gamepadSupportAvailable = navigator.getGamepads ||
		!!navigator.webkitGetGamepads ||
		!!navigator.webkitGamepads;

		if (!gamepadSupportAvailable) {
			console.log( 'NOT SUPPORTED' );
		} else {
			if ('ongamepadconnected' in window) {
				window.addEventListener('gamepadconnected', onGamepadConnect.bind( this ), false);
				window.addEventListener('gamepaddisconnected', gamepadSupport.onGamepadDisconnect.bind( this ), false);
			} else {
				this.startPolling();
			}
		}
	}

	startPolling() {

		if (!this.ticking) {
			this.ticking = true;
			this.tick();
		}
	}

	stopPolling() {
		this.ticking = false;
	}

	tick() {
		this.pollStatus();
		this.scheduleNextTick();
	}

	scheduleNextTick() {

		if (this.ticking) {
			requestAnimationFrame( this.tick.bind( this ) );
		}
	}

	pollStatus() {

		this.pollGamepads();

	}

	filter = function( v ) {

		return ( Math.abs( v ) > this.threshold ) ? v : 0;

	}

	pollGamepads() {

		var rawGamepads =
		(navigator.getGamepads && navigator.getGamepads()) ||
		(navigator.webkitGetGamepads && navigator.webkitGetGamepads());


		if( rawGamepads && rawGamepads[ 0 ] ) {

			var g = rawGamepads[ 0 ];
			
			let ax2 = this.filter( g.axes[ 2 ] );
			let ax3 = this.filter( g.axes[ 3 ] );

			// todo - update current lon and lat from camera for supporting multiple controls

			this.lon += ax2;
			this.lat -= ax3;
			this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
			var phi = ( 90 - this.lat ) * Math.PI / 180;
			var theta = this.lon * Math.PI / 180;

			this.target.x = 10 * Math.sin( phi ) * Math.cos( theta );
			this.target.y = 10 * Math.cos( phi );
			this.target.z = 10 * Math.sin( phi ) * Math.sin( theta );

			this.target.add( this.object.position );

			// only if changed, so control with mouse still possible
			if (ax2 != 0 || ax3 != 0) {
				this.object.lookAt( this.target );
			} 

			this.rotMatrix.extractRotation( this.object.matrix );
			this.dir.set( 
				this.filter( g.axes[ 0 ] ), 
				this.filter( g.buttons[ 6 ].value ) - this.filter( g.buttons[ 7 ].value ), 
				this.filter( g.axes[ 1 ] ) 
			);
			this.dir.multiplyScalar( 5 ); //.1
			this.dir.applyMatrix4( this.rotMatrix );
			this.object.position.add( this.dir );
		}
	}
}

export { GamepadControls }