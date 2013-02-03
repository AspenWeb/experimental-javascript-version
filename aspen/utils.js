var logger = require('./logger.js');

/*
 * Checks the encoding of the file to see how to return it
 */
exports.check_encoding = function(buffer) {
    var contentStartUTF8 = buffer.toString('utf8', 0, 24),
        encoding = 'utf8',
        i,
        charCode;

    for (i = 0; i < contentStartUTF8.length; i += 1) {
        charCode = contentStartUTF8.charCodeAt(i);
        if (charCode == 65533 || charCode <= 8) {
            logger.debug("Encoding CharCode: " + charCode);
            encoding = 'binary';
            break;
        }
    }

    return encoding;
}