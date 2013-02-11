var utils = require('../../utils.js');

module.exports = function () {
    "use strict";

    function padStr(i) {
        return (i < 10) ? "0" + i : i.toString();
    }

    function getDate() {
        var temp = new Date(),
            dateStr = padStr(temp.getHours()) + ":" + padStr(temp.getMinutes()) + ":" + padStr(temp.getSeconds());

        return dateStr;
    }

    return function (message, level, options) {
        return getDate();
    };
};
