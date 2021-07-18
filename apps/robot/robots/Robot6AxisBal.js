import { Robot6Axis } from './Robot6Axis.js';

const balancerParts = {
    Base: 1,
    Joint: 2,
    Balancer: 3
};

export class Robot6AxisBal extends Robot6Axis {

    constructor() {
        super();
        this.balJoints = [];
        for (let idx = 0; idx < 2; idx++) {
            this.balJoints.push(new THREE.Group());
        }

        this.radius = 0;
        this.angleOffset = 0;
        this.jointAngleOffset = 0;
        this.baseAngleOffset = 0;
        this.baseOffset = new THREE.Vector3();
    }

    updateJoints() {
        // set balJoint[0] and balJoint[1]

        let joint2value = this.getJointValue(1);

        let balVec = new THREE.Vector3(Math.cos(joint2value + this.angleOffset) * this.radius, 0, Math.sin(joint2value + this.angleOffset) * this.radius);
        // console.log(balVec);
        balVec = balVec.sub(this.baseOffset);

        let angle = Math.atan(balVec.z / -balVec.x);

        this.balJoints[0].rotation.y = -angle - this.baseAngleOffset;
        this.balJoints[1].rotation.y = this.angleOffset - joint2value + this.jointAngleOffset - Math.PI/2 - angle;
    }

    get joint2() {
        return super.joint2;
    }
    /**
     * @param {number} value
     */
    set joint2 (value) {
        super.joint2 = value;
        this.updateJoints();
    }

    load(modelName, onLoad, onProgress, onError) {
        var self = this;
        super.load(modelName, function (robot) {

            let balBase = robot.children[balancerParts.Base];
            let balJoint = robot.children[balancerParts.Joint];
            let balancer = robot.children[balancerParts.Balancer];

            let tempGroup = self.balJoints[0];
            tempGroup.name = "balJoint1";
            tempGroup.position.copy(balBase.children[0].position);
            tempGroup.attach(balBase);
            self.joints[0].attach(tempGroup);

            tempGroup = self.balJoints[1];
            tempGroup.name = "balJoint2";
            tempGroup.position.copy(balJoint.children[0].position);
            tempGroup.attach(balJoint);
            self.joints[1].attach(tempGroup);

            balJoint.attach(balancer);

            let yAx = new THREE.Vector3(0, 1, 0);
            let xAx = new THREE.Vector3(1, 0, 0); // needed to determine sign of angle

            let vec = new THREE.Vector3().subVectors(balJoint.children[0].position, self.joints[1].position).projectOnPlane(yAx);

            self.radius = vec.length();

            self.angleOffset = vec.angleTo(xAx) * Math.sign(yAx.dot(xAx.cross(vec)));

            // console.log(vec);
            // console.log(self.angleOffset);
            // vec = new THREE.Vector3(Math.cos(self.angleOffset) * -self.radius, 0, Math.sin(self.angleOffset) * self.radius); // check angle
            // console.log(vec);

            self.baseAngleOffset = balBase.children[0].rotation.y;
            self.jointAngleOffset = balJoint.children[0].rotation.y;

            self.baseOffset = self.baseOffset.subVectors(balBase.children[0].position, self.joints[1].position).projectOnPlane(yAx);
            //console.log(self.baseOffset);

            if (onLoad) onLoad(robot);
        } , onProgress, onError);
    }
}