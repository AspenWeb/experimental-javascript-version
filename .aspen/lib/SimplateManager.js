/**
 * @file SimplateManager handles all system templates for errors / dir listing
 * @author Fabian Faßbender
 * @version 1
 * @module lib/SimplateManager
 */

/**
 * @requires config.json The global config for Aspen
 * @type {Object}
 */
var config = require('../config.json');

/**
 * @requires lib/logger/index The Logger from Aspen
 * @type {Object}
 */
var logger = require('./logger/index');

/**
 * @requires module:fs The NodeJS FS Module for handling FS I/O
 * @type {Object}
 */
var fs = require('fs');

/**
 * @requires module:path The NodeJS PATH Module for handling PATHs
 * @type {Object}
 */
var path = require('path');

/**
 * Absolute Path of the aspen system dir
 * @type {String}
 */
var aspenWWWPath = path.resolve(config.www_root + path.sep);

/**
 * Absolute Path of the aspen Simplate dir
 * @type {String}
 */
var aspenPath = path.resolve(config.simplate_root + path.sep);

/**
 * Build up a new SimplateManager
 * @constructor
 */
function SimplateManager() {
    "use strict";

    this.AspenParser = null;
}

/**
 * This function searches for valid Simplate Files
 * @param {String} searchPath The basepath for that we are searching
 * @param {SimplateManager~resolvedSimplate} done Callback that get called is the search has finished
 */
SimplateManager.prototype.resolveSimplate = function (searchPath, done) {
    "use strict";

    var currentIndex = -1;

    function checkForSimplate(file, next) {
        logger.debug("Checking File: " + file);
        fs.stat(file, function (err, stat) {
            if (err || stat.isFile() !== true) {
                next();
            } else {
                done(true, file);
            }
        });
    }

    function nextIteration() {
        currentIndex += 1;

        if (typeof config.simplateTypes[currentIndex] !== "undefined") {
            checkForSimplate(searchPath + config.simplateTypes[currentIndex], nextIteration);
        } else {
            logger.warn("No Simplate File found for File: " + searchPath);
            done(false);
        }
    }

    nextIteration();
};

/**
 * Loads the error Simplates into the Response
 * @param {Object} res The Response where the error page should be written to
 * @param {Number} errorCode The HTTP Error Code which the error belongs to
 */
SimplateManager.prototype.error = function (req, res, errorCode) {
    "use strict";

    var self = this;

    logger.debug("Searching Simplate for: " + (aspenPath + path.sep + "error") + path.sep + errorCode);
    this.resolveSimplate((aspenPath + path.sep + "error") + path.sep + errorCode, function (found, file) {
        if (found === false) {
            self.resolveSimplate((aspenPath + path.sep + "error") + path.sep + "500", function (found, file) {
                if (found === false) {
                    logger.error("Can't find a valid Error File for Error " + errorCode + ".");
                    res.statusCode = 500;
                    res.end("<h1>500 - Internal Server Error</h1><br>No error Simplate found");
                } else {
                    self.AspenParser.parse(req, res, file);
                }
            });
        } else {
            self.AspenParser.parse(req, res, file);
        }
    });
};

/**
 * Loads the WWW Simplates into the Response
 * @param {Object} res The Response where the error page should be written to
 * @param {Number} file The Simplate that should be resolved
 */
SimplateManager.prototype.resolveWWW = function (req, res, file) {
    "use strict";

    var self = this;

    logger.debug("Searching Simplate for: " + file);
    this.resolveSimplate(file, function (found, file) {
        if (found === false) {
            self.error(req, res, 404);
        } else {
            self.AspenParser.parse(req, res, file);
        }
    });
};

/**
 * This function searches for a valid autoindex Simplate File
 * @param {String} searchPath The basepath for that we are searching
 * @param {SimplateManager~resolvedSimplate} done Callback that get called is the search has finished
 */
SimplateManager.prototype.resolveAutoIndexSimplate = function (searchPath, done) {
    "use strict";

    var currentIndex = -1;

    function checkForAutoIndex(file, next) {
        logger.debug("Checking File: " + file);
        fs.stat(file, function (err, stat) {
            if (err || stat.isFile() !== true) {
                next();
            } else {
                done(true, file);
            }
        });
    }

    function nextIteration() {
        currentIndex += 1;

        if (typeof config.indices[currentIndex] !== "undefined") {
            checkForAutoIndex(searchPath + config.indices[currentIndex], nextIteration);
        } else {
            logger.warn("No Simplate File found for AutoIndex: " + searchPath);
            done(false);
        }
    }

    nextIteration();
};

/**
 * Loads the error Simplates into the Response
 * @param {Object} res The Response where the error page should be written to
 * @param {Number} errorCode The HTTP Error Code which the error belongs to
 */
SimplateManager.prototype.autoIndex = function (req, res, directory) {
    "use strict";

    var self = this;

    logger.debug("Autoindex for: " + directory);
    if (config.list_directories !== true) {
        self.error(req, res, 403);
    } else {
        this.resolveAutoIndexSimplate(directory, function (found, file) {
            if (found) {
                if (config.simplateTypes.indexOf(path.extname(file)) !== -1) {
                    self.AspenParser.parse(req, res, file);
                } else {
                    res.statusCode = 200;
                    fs.createReadStream(file).pipe(res);
                }
            } else {
                self.resolveSimplate(aspenPath + path.sep + "autoindex", function (found, file) {
                    if (found) {
                        self.AspenParser.parse(req, res, file);
                    } else {
                        self.error(req, res, 500);
                    }
                });
            }
        });
    }
};

/**
 * Sets the AspenParser to handle the parsing with
 * @param {Object} AspenParser
 */
SimplateManager.prototype.appendAspenParser = function (AspenParser) {
    "use strict";

    this.AspenParser = AspenParser;
};

module.exports = SimplateManager;

/**
 * Callback which handles the result of resolveSimplate
 * @callback SimplateManager~resolvedSimplate
 * @param {boolean} found True if a simplate was found, false if not
 * @param {string|undefined} file File that has been found or undefined if nothing has been found
 */