module.exports.makeStringExactLength = function (string, length) {
    "use strict";

    var restLength,
        i;

    if (length) {
        if (string.length >= length) {
            return string.substr(0, length);
        } else {
            restLength = length - string.length;
            for (i = 0; i < restLength; i += 1) {
                string += " ";
            }

            return string;
        }
    } else {
        return string;
    }
};

module.exports.round = function (number, precision) {
    "use strict";

    var a = Math.pow(10, precision);
    return (Math.round(number * a) / a);
};

module.exports.toHumanReadableBytes = function (bytes, suffix, precision) {
    "use strict";

    if (typeof suffix === 'undefined') {
        return bytes;
    }

    if (typeof precision === 'undefined') {
        precision = 2;
    }

    if (suffix === "kB") {
        return this.round(bytes / 1024, precision);
    } else if (suffix === "mB") {
        return this.round(bytes / (1024 * 1024), precision);
    } else if (suffix === "gB") {
        return this.round(bytes / (1024 * 1024 * 1024), precision);
    }

    return bytes;
};