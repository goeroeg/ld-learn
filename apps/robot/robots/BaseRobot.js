import * as OBJS from '../../../gfx/Objects.js';

import { ldrawColors } from '../../../gfx/LDrawHelper.js';

export class BaseRobot {
    constructor() {
        this.description = "Abstract Robot";
        this.joints = [];
        this.jointAxis = [];
        this.axisLimits = [];
        this.jointLimits = [];
        this.axisVel = [];
        this.jointVel = [];
        this.axisAcc = [];
        this.jointAcc = [];
    }

    get numJoints() {
        return this.joints.length;
    }

    updateJoints() { }

    load( modelName, onLoad, onProgress, onError ) {
        this.filename = modelName;
        OBJS.loadModel(modelName, function ( model ) {

                // Convert from LDraw coordinates: rotate -90 degrees around X
                model.rotateX(-Math.PI/2);

                self.model = model;

                if (onLoad) onLoad(model);
            }, onProgress, onError, false, ldrawColors.Main_Colour);
    }
}
