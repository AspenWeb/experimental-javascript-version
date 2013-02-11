var utils = require('../../utils.js');

module.exports = function (logger) {
    "use strict";

    return function (message, level, options) {
        var timeRun = process.hrtime(logger.startTime);
        timeRun[1] = timeRun[1] / 1e6;
        return utils.makeStringExactLength(timeRun.join("."), options.length);
    };
};
