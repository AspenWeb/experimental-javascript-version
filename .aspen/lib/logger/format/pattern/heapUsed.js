var utils = require('../../utils.js');

module.exports = function () {
    "use strict";

    return function (message, level, options) {
        var heapUsed = utils.toHumanReadableBytes(process.memoryUsage().heapUsed, options.suffix, options.round).toString();
        return utils.makeStringExactLength(heapUsed, options.length) + ((typeof options.suffix !== 'undefined') ? options.suffix : "");
    };
};
