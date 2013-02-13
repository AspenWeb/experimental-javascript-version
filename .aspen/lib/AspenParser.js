/**
 * @file Parser for handling all Aspen files
 * @author Fabian Faßbender
 * @version 1
 * @module lib/AspenParser
 */

/**
 * @requires lib/ContextFactory ContextFactory for handling all contexts
 */
var ContextFactory = require('./ContextFactory');

/**
 * @requires lib/logger/index The Logger from Aspen
 * @type {Object}
 */
var logger = require('./logger/index');

/**
 * @requires config.json The global config for Aspen
 * @type {Object}
 */
var config = require('../config.json');

/**
 * @requires module:mime Mime tells you the type of a file
 */
var mime = require('mime');

/**
 * @requires module:mustache The view Renderer used in Aspen.JS
 */
var mustache = require('mustache');

/**
 * @requires module:fs The NodeJS FS Module for FS i/o
 */
var fs = require('fs');

/**
 * @requires module:path The NodeJS PATH Module for handling PATHs
 * @type {Object}
 */
var path = require('path');

/**
 * This holds the page 0 ContextFactory
 * @type {Object}
 */
var page0Ctx = new ContextFactory();

/**
 * This holds all loaded Files for a maximum idle time of 5 Minutes
 * @type {Object}
 */
var fileCache = {};

var aspen = config;
aspen.package = require("../../package.json");
aspen.wwwPath = path.resolve(config.www_root + path.sep);

/**
 * Creates a new AspenParser
 * @constructor
 */
function AspenParser() {
    "use strict";

    this.SimplateManager = null;

    this._expireInterval = setInterval(function () {

    }, 5 * 60 * 1000);
}

/**
 * Executes all Pages in a Simplate
 * @param {Object} req Request where the headers and stuff is in
 * @param {Object} res Response where the executed page goes into
 * @param {Object} pages The fileCache Object that holds the data for the file
 * @private
 */
AspenParser.prototype._executePages = function (req, res, pages) {
    "use strict";

    var ctx,
        self = this;

    /* Change the timeout for this cache */
    pages.timeout = (new Date()).getTime();

    /* Check if Context is available */
    if (page0Ctx.checkForCtx(pages.file) === true) {
        ctx = page0Ctx.getCtx(pages.file);
    } else {
        /* A new Context must be created */
        ctx = page0Ctx.createCtx(pages.file, {require: require, console: console, logger: logger, aspen: aspen});

        /* Execute page 0 in it if given */
        if (pages[0].trim() !== "") {
            try {
                ctx.run(pages[0]);
            } catch (e) {
                logger.warn("Error in executing Init in File " + pages.file + ": " + e.message);
                logger.debug(e.stack);
                self.SimplateManager.error(req, res, 500);
                return;
            }
        }
    }

    /* Append the Request and the Response Object to the current Context */
    ctx.request = req;
    ctx.response = res;

    /* Create a callback for the async mode */
    ctx.finished = function () {
        if (pages.mime.indexOf('text/') === 0) {
            var out = mustache.render(pages["2"], ctx);
            res.setHeader("Content-Type", pages.mime);
            res.statusCode = 200;
            res.end(out);
        } else {
            res.setHeader("Content-Type", pages.mime);
            res.statusCode = 200;

            if (typeof templateVars.response.body !== "string") {
                templateVars.response.body = JSON.stringify(templateVars.response.body);
            }

            res.end(templateVars.response.body);
        }
    };

    /* Get the Page 1 and execute it */
    try {
        ctx.run(pages["1"]);
    } catch (e) {
        logger.warn("Executing Simplate Error in File " + pages.file + ": " + e.message);
        logger.debug(e.stack);
        self.SimplateManager.error(req, res, 500);
        return;
    }
};

/**
 * Parses a Simplate and write the result into the Response
 * @param {Object} res Response where the parsed Values are written to
 * @param {String} file File that should be parsed
 */
AspenParser.prototype.parse = function (req, res, file) {
    "use strict";

    var self = this,
        pages;

    this.checkIfValidSimplate(file, function (valid) {
        if (valid) {
            if (typeof fileCache[file] !== "undefined") {
                self._executePages(req, res, fileCache[file]);
            } else {
                fs.readFile(file, function (err, content) {
                    if (err) {
                        logger.warn("Could not read Simplate File " + file + ": " + err.message);
                        self.SimplateManager.error(req, res, 500);
                    } else {
                        /* Split the file into its pages */
                        pages = content.toString().split("^L");

                        /* Create a new Object for this file */
                        fileCache[file] = {file: file};

                        /* Store pages */
                        fileCache[file]["0"] = (typeof pages[0] !== undefined) ? pages[0] : "";
                        fileCache[file]["1"] = pages[1];

                        if (pages.length > 2) {
                            fileCache[file]["2"] = pages[2];
                        }

                        /* Get the mime type for this file */
                        fileCache[file].mime = mime.lookup(file);

                        self._executePages(req, res, fileCache[file]);
                    }
                });
            }
        } else {
            /* It is no Simplate, just pass it to the client */
            res.statusCode = 200;
            res.setHeader("Content-Type", mime.lookup(file));
            fs.createReadStream(file).pipe(res);
        }
    });
};

/**
 *
 * @param {String} file
 * @param {AspenParser~checkIfValidCallback} completeCB
 */
AspenParser.prototype.checkIfValidSimplate = function (file, completeCB) {
    "use strict";

    var readStream = fs.createReadStream(file),
        lastChunk = "",
        curChunk = "";

    readStream.on('data', function (data) {
        readStream.pause();

        /* Merge the chunks */
        curChunk = lastChunk + data.toString();

        /* Check if ^L is present */
        if (curChunk.indexOf("^L") !== -1) {
            readStream.destroy();
            completeCB(true);
        }

        lastChunk = data.toString();

        readStream.resume();
    });

    readStream.on('end', function () {
        completeCB(false);
    });
};

/**
 * Sets the SimplateManager that is used to resolve Simplates
 * @param {Object} SimplateManager
 */
AspenParser.prototype.appendSimplateManager = function (SimplateManager) {
    "use strict";

    this.SimplateManager = SimplateManager;
};

module.exports = AspenParser;

/**
 * Callback for checkIfValidSimplate
 * @callback AspenParser~checkIfValidCallback
 * @param {boolean} True if it is valid, false if not
 */
