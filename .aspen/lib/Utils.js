/**
 * @file Utils for everything
 * @author Fabian Faßbender
 * @version 1
 * @module lib/Utils
 */

/**
 * Checks the encoding of a Buffer to be valid UTF8
 * @param {Buffer} buffer Buffer to be checked
 * @returns {String} utf8 if utf8 encoded otherwise binary
 */
exports.checkEncoding = function (buffer) {
    "use strict";

    var contentStartUTF8 = buffer.toString('utf8', 0, 24),
        encoding = 'utf8',
        i,
        charCode;

    for (i = 0; i < contentStartUTF8.length; i += 1) {
        charCode = contentStartUTF8.charCodeAt(i);
        if (charCode === 65533 || charCode <= 8) {
            encoding = 'binary';
            break;
        }
    }

    return encoding;
};