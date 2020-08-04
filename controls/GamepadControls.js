// import * as THREE from '../node_modules/three/build/three.module.js';


/**
 * @author spite / https://github.com/spite - modified
 */
/*global THREE, console */

class GamepadControls extends THREE.EventDispatcher {

	moveSensitivity = 1;
	lookSensitivity = 1;
	buttonActions = [];
	moveAction;


  	constructor( controls ) {
		super();

		this.controls = controls;
		
		this.threshold = .15; // .05
	
		this.buttonStates = [];

		this.init();
	}

	init() {

		var gamepadSupportAvailable = navigator.getGamepads ||
		!!navigator.webkitGetGamepads ||
		!!navigator.webkitGamepads;

		if (!gamepadSupportAvailable) {
			console.log( 'Gamepads NOT SUPPORTED' );
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
			
			let ax0 = this.filter( g.axes[ 0 ] ) * 6 * this.moveSensitivity;  
			let ax1 = this.filter( g.axes[ 1 ] ) * -6 * this.moveSensitivity;

			let ax2 = this.filter( g.axes[ 2 ] ) * 0.025 * this.lookSensitivity;
			let ax3 = this.filter( g.axes[ 3 ] ) * 0.025 * this.lookSensitivity;
			
			for (let idx=0; idx < g.buttons.length; idx++) {				
				let buttonValue = g.buttons[idx].value > 0 ? 1 : 0;
				if (buttonValue !== this.buttonStates[idx] ) {
					this.buttonStates[idx] = buttonValue;
					if (buttonValue && this.buttonActions[idx]) this.buttonActions[idx]();
				}
			}

			this.controls.rotateCamera(ax2, ax3);
			this.controls.moveForward(ax1);
			this.controls.moveRight(ax0);

			if (this.moveAction && (ax0 !=0 || ax1 !=0 )) this.moveAction();
		}
	}
}

export { GamepadControls }