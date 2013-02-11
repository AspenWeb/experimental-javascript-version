function ConsoleWriter(logger, cb) {
    "use strict";

    //Auf Lines reagieren, wenn diese vom Logger kommen
    logger.on('newLine', function (line) {
        console.log(line);
    });

    cb();
}

module.exports = function (logger, cb) {
    "use strict";
    return new ConsoleWriter(logger, cb);
};