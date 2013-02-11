var utils = require('../../utils.js');

module.exports = function () {
    "use strict";

    return function (message, level, options) {
        var rss = utils.toHumanReadableBytes(process.memoryUsage().rss, options.suffix, options.round).toString();
        return utils.makeStringExactLength(rss, options.length) + ((typeof options.suffix !== 'undefined') ? options.suffix : "");
    };
};
