var utils = require('../../utils.js');

module.exports = function () {
    "use strict";

    return function (message, level, options) {
        var heapTotal = utils.toHumanReadableBytes(process.memoryUsage().heapTotal, options.suffix, options.round).toString();
        return utils.makeStringExactLength(heapTotal, options.length) + ((typeof options.suffix !== 'undefined') ? options.suffix : "");
    };
};
