

export class MotionExecutor {
    constructor(robot) {
        this.robot = robot;
        this.mixer = new THREE.AnimationMixer();
        this.clock = new THREE.Clock(true);

        this.history = [[], [], [], [], []]; // 0 curr pos, 1 last pos, 2 curr vel, 3 last vel, 4 curr acc        

        this.updateJointHistory();
        this.history[1] = this.history[0].slice();
        
        this.calcDerivedHistory(1, 1);
        this.history[3] = this.history[2].slice();
        this.calcDerivedHistory(1, 2);

        this.lastTarget = this.history[0].slice();

        this.error = "No error."

        this.override = 1;
    }    

    set override(value) {
        this.mixer.timeScale = value;
    }
    get override() {
        return this.mixer.timeScale;
    }

    update() {
        let delta = this.clock.getDelta();
        if (delta > 0) {
            this.mixer.update(delta);
            this.robot.updateJoints();

            if (!this.checkJointLimits(delta)) {               
                // brake and display error
                this.mixer.stopAllAction();
                for (let idx = 0; idx < this.robot.numJoints; idx++) {                
                    this.mixer.uncacheRoot(this.robot.joints[idx]);
                }                
            } // else everything is fine
        }
    }

    checkJointLimits(delta) {
        // check position, velocity and acceleration limits
       
        this.history[1] = this.history[0].slice();
        this.updateJointHistory();
        this.history[3] = this.history[2].slice();
        this.calcDerivedHistory(delta, 1);
        this.calcDerivedHistory(delta, 2);

        let ok = true;

        for (let idx = 0; idx < this.robot.numJoints; idx++) {
            ok &= (this.history[0][idx] <= this.robot.jointLimits[idx].max && this.history[0][idx] >= this.robot.jointLimits[idx].min);
            if (!ok) {
                this.error = "Joint position" + (idx + 1) + "(" + this.history[0][idx] + ") out of limits (" + this.robot.jointLimits[idx].min + " - " + this.robot.jointLimits[idx].max + ")";
                break;
            }

            ok &= (Math.abs(this.history[2][idx]) <= this.robot.jointVel[idx]);
            if (!ok) {
                this.error = "Joint" + (idx + 1) +" velocity (" + Math.abs(this.history[2][idx]) + ") exceeds limit (" + this.robot.jointVel[idx] + ")";
                break;
            }

            ok &= (Math.abs(this.history[4][idx]) <= this.robot.jointAcc[idx]);
            if (!ok) {
                this.error = "Joint" + (idx + 1) + " acceleration (" + Math.abs(this.history[4][idx]) + ") exceeds limit (" + this.robot.jointAcc[idx] + ")";
                break;
            }
        }

        if (!ok) {
            console.warn("Motion execution: " + this.error);
        }

        return ok;
    }

    updateJointHistory() {        
        for (let idx = 0; idx < this.robot.numJoints; idx++) {
            this.history[0][idx] = this.robot.joints[idx].rotation[this.robot.jointAxis[idx]];            
        }        
    }

    resetJoints() {
        for (let idx = 0; idx < this.robot.numJoints; idx++) {
            this.robot.joints[idx].rotation[this.robot.jointAxis[idx]] = this.history[0][idx];
        } 
    }

    calcDerivedHistory(delta, derived) {
        let offset = derived * 2;
        for (let idx = 0; idx < this.robot.numJoints; idx++) {
            this.history[offset][idx] = (this.history[offset - 1][idx] - this.history[offset - 2][idx]) / delta;
        }
    }

    moveToPose(pose) {
        let actions = [];
        let maxDuration = 0;        
        let ramptimes = [];

        for (let idx = 0; idx < this.robot.numJoints; idx++) {                
            this.mixer.uncacheRoot(this.robot.joints[idx]);
        }
        
        this.resetJoints();

        this.lastTarget = this.history[0].slice();

        for (let idx = 0; idx < this.robot.numJoints; idx++) {
            
            if (this.lastTarget[idx] != pose[idx]) {

                let maxVel = this.robot.jointVel[idx] * 0.97; // use factor as animation system does not use acceleration
                let maxAcc = this.robot.jointAcc[idx] * 0.92;

                let ramptime = maxVel / maxAcc;
                let distance = Math.abs(this.lastTarget[idx] - pose[idx]);
                let duration = distance / maxVel;                

                if (duration < ramptime) { // not reaching full speed                        
                    duration = Math.sqrt(2 * distance / maxAcc);
                    ramptime = duration / 2;
                    duration += ramptime;            
                    // better algorithm ?        
                }
                else {
                    duration += ramptime;
                }

                let times = [0, 1];                
                let values = [this.lastTarget[idx], pose[idx]];
                let sgn = Math.sign(pose[idx] - this.lastTarget[idx]);         
                for (let rIdx=1; rIdx > 0; rIdx-=0.01)
                {                    
                    let rampdistance = Math.pow(ramptime * rIdx, 2) * maxAcc / 2 * sgn;
                    times.splice(1, 0, ramptime * rIdx / duration);
                    times.splice(times.length - 1, 0, (duration - ramptime * rIdx) / duration);

                    values.splice(1, 0, this.lastTarget[idx] + rampdistance);
                    values.splice(values.length - 1, 0, pose[idx] - rampdistance);                 
                }

                maxDuration = Math.max(maxDuration, duration);
 
                var trackName = '.rotation[' + this.robot.jointAxis[idx] + ']';
                var track = new THREE.NumberKeyframeTrack(trackName, times, values);
                let clip = new THREE.AnimationClip('joint' + idx, 1, [track]);

                let action = this.mixer.clipAction(clip, this.robot.joints[idx]);
                // action.fadeIn(ramptime);//.fadeOut(ramptime);
                actions.push(action);
                this.lastTarget[idx] = pose[idx];
            }
        }

        for (let action of actions) {
            action.setDuration(maxDuration);
            action.clampWhenFinished = true;
            action.setLoop(THREE.LoopOnce);            
            action.syncWith(actions[0]);                

            action.play();            
        }

        console.log(actions);
        
    }
}
