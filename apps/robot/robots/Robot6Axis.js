import { BaseRobot } from './BaseRobot.js';

import { Kinematics } from '../../../web_modules/kinematics/dist/kinematics.js';

const RobotParts = {
    Base:   0,
    Joint1: 1,
    Link1:  2,
    Joint2: 3,
    Link2:  4,
    Joint3: 5,
    Link3:  6,
    Joint4: 7,
    Link4:  8,
    Joint5: 9,
    Link5:  10,
    Joint6: 11,
    Flange: 12,
    Tool:   13
}

export class Robot6Axis extends BaseRobot {

    constructor() {
        super();
        for (let idx = 0; idx < 6; idx++) {
            this.joints.push(new THREE.Group());
            this.axisLimits.push({min:-180, max:180}); // limits in °
            this.jointLimits.push({min:-Math.PI, max:Math.PI}); // limits in rad
            this.axisVel.push(160); // default velocity in °/s, override by settings later
            this.jointVel.push(160 / 180 * Math.PI); // default velocity in rad/s, override by settings later
            this.axisAcc.push(600); // default acceleration in °/s², override by settings later
            this.jointAcc.push(600 / 180 * Math.PI); // default acceleration in °/s², override by settings later
        }
        this.jointAxis = ['z', 'y', 'y', 'x', 'y', 'x'];

    }

    getJointValue(idx) {
        return this.joints[idx].rotation[this.jointAxis[idx]];
    }

    setJointValue(idx, value) {
        this.joints[idx].rotation[this.jointAxis[idx]] = value;
    }

    get joint1() {
        return this.getJointValue(0);
    }

    /**
     * @param {number} value
     */
    set joint1(value) {
        this.setJointValue(0, value);
    }

    get joint2() {
        return this.getJointValue(1);
    }

    /**
     * @param {number} value
     */
    set joint2(value) {
        this.setJointValue(1, value);
    }

    get joint3() {
        return this.getJointValue(2);
    }

    /**
     * @param {number} value
     */
    set joint3(value) {
        this.setJointValue(2, value);
    }

    get joint4() {
        return this.getJointValue(3);
    }

    /**
     * @param {number} value
     */
    set joint4(value) {
        this.setJointValue(3, value);
    }

    get joint5() {
        return this.getJointValue(4);
    }

    /**
     * @param {number} value
     */
    set joint5(value) {
        this.setJointValue(4, value);
    }

    get joint6() {
        return this.getJointValue(5);
    }
    /**
     * @param {number} value
     */
    set joint6(value) {
        this.setJointValue(5, value);
    }

    load(modelName, onLoad, onProgress, onError) {

        var self = this;

        super.load(modelName, function (model) {

            // rebuild geometry
            var robot = new THREE.Group();
            var groups = [];

            model.traverse( c => {
                if (c.isMesh) {
                    var step = c.parent.userData.constructionStep;
                    if (!groups[step]) {
                        groups[step] = [];
                    }
                    groups[step].push(c);
                }
            });

            // check all parts are available
            for (let part in RobotParts) {
                if (!groups[RobotParts[part]]) {
                    console.warn("Missing robot part " + part + " in " + modelName);
                }
            }

            let parts = [];
            // regroup meshes
            for (let group of groups) {
                let newGroup = new THREE.Group();
                for (let mesh of group) {
                    newGroup.attach(mesh);
                }
                parts.push(newGroup);
                robot.attach(newGroup);
            }

            // build graph
            parts[RobotParts.Base].attach(parts[RobotParts.Joint1]);
            parts[RobotParts.Link1].attach(parts[RobotParts.Joint2]);
            parts[RobotParts.Link2].attach(parts[RobotParts.Joint3]);
            parts[RobotParts.Link3].attach(parts[RobotParts.Joint4]);
            parts[RobotParts.Link4].attach(parts[RobotParts.Joint5]);
            parts[RobotParts.Link5].attach(parts[RobotParts.Joint6]);
            parts[RobotParts.Flange].attach(parts[RobotParts.Tool]);

            let tempGroup = self.joints[0];
            tempGroup.name = "Joint1";
            tempGroup.position.copy(parts[RobotParts.Joint1].children[0].position);
            parts[RobotParts.Joint1].add(tempGroup);
            tempGroup.attach(parts[RobotParts.Link1]);

            tempGroup = self.joints[1];
            tempGroup.name = "Joint2";
            tempGroup.position.copy(parts[RobotParts.Joint2].children[0].position);
            parts[RobotParts.Joint2].add(tempGroup);
            tempGroup.attach(parts[RobotParts.Link2]);

            tempGroup = self.joints[2];
            tempGroup.name = "Joint3";
            tempGroup.position.copy(parts[RobotParts.Joint3].children[0].position);
            //tempGroup.rotateY(Math.PI/2);
            parts[RobotParts.Joint3].add(tempGroup);
            tempGroup.attach(parts[RobotParts.Link3]);

            tempGroup = self.joints[3];
            tempGroup.name = "Joint4";
            tempGroup.position.copy(parts[RobotParts.Joint4].children[0].position);
            parts[RobotParts.Joint4].add(tempGroup);
            tempGroup.attach(parts[RobotParts.Link4]);

            tempGroup = self.joints[4];
            tempGroup.name = "Joint5";
            tempGroup.position.copy(parts[RobotParts.Joint5].children[0].position);
            //tempGroup.rotateY(Math.PI/2);
            parts[RobotParts.Joint5].add(tempGroup);
            tempGroup.attach(parts[RobotParts.Link5]);

            tempGroup = self.joints[5];
            tempGroup.name = "Joint6";
            tempGroup.position.copy(parts[RobotParts.Joint6].children[0].position);
            //tempGroup.rotateY(Math.PI);
            //tempGroup.rotateZ(Math.PI);

            parts[RobotParts.Joint6].add(tempGroup);

            let flangeGroup = new THREE.Group();
            flangeGroup.name = "Flange";
            flangeGroup.position.copy(parts[RobotParts.Flange].children[0].position);
            //flangeGroup.rotateY(Math.PI);
            //flangeGroup.rotateZ(-Math.PI);

            tempGroup.attach(flangeGroup);
            flangeGroup.attach(parts[RobotParts.Flange]);
            self.Flange = flangeGroup;

            let toolGroup = new THREE.Group();
            toolGroup.name = "Tool";
            toolGroup.position.copy(parts[RobotParts.Tool].children[0].position);
            toolGroup.rotateY(Math.PI);
            //toolGroup.rotateZ(Math.PI);
            flangeGroup.attach(toolGroup);
            toolGroup.attach(parts[RobotParts.Flange]);
            self.Tool = toolGroup;

            // console.log(robot);

            self.model = robot;

            let geometry = [];
            for (let idx = 1; idx < self.joints.length; idx++) {
                let v = new THREE.Vector3().subVectors(self.joints[idx].position, self.joints[idx-1].position);
                geometry.push([Math.round(v.x), Math.round(v.z), Math.round(-v.y)]);
            }
            // IMPORTANT: make sure in the model the axes 4 and 6 have the same y coordinates - even if its not 100% accurate built

            //geometry[3][2] = 0;
            //geometry[4][2] = 0;

            console.log(geometry);

            //self.kinematics = new Kinematics(geometry);


            if (onLoad) onLoad(robot);
        } , onProgress, onError);
    }

    inverse(position, orientation) {
        let result = [];
        if (this.kinematics) {
            result = this.kinematics.inverse(position.x, position.z, -position.y, orientation.x, orientation.z, -orientation.y);
        }
        return result;
    }
}

function exchangeYZ(vector) {
    // change y and z
    return new THREE.Vector3(vector.x, vector.z, vector.y);
}

