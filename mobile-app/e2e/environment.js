const {
    DetoxCircusEnvironment,
    SpecReporter,
    WorkerAssignReporter,
} = require('detox/runners/jest-circus');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
    constructor(config, context) {
        super(config, context);

        this.initTimeout = 300000;

        // This will register reporters in Jest
        this.registerListeners({
            SpecReporter,
            WorkerAssignReporter,
        });
    }
}

module.exports = CustomDetoxEnvironment;
