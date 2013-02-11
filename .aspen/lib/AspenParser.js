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
 * @requires module:vm NodeJS VM Module to create Scripts
 */
var vm = require('vm');

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
 * Parses a Simplate and write the result into the Response
 * @param {Object} res Response where the parsed Values are written to
 * @param {String} file File that should be parsed
 */
AspenParser.prototype.parse = function (req, res, file) {
    "use strict";

    var self = this,
        ctx,
        pages,
        pageIndex;

    this.checkIfValidSimplate(file, function (valid) {
        if (valid) {
            if (typeof fileCache[file] !== "undefined") {
                /* Change the timeout for this cache */
                fileCache[file].timeout = (new Date()).getTime();

                /* Check if Context is available */
                if (page0Ctx.checkForCtx(file) === true) {
                    ctx = page0Ctx.getCtx(file);
                } else {
                    ctx = page0Ctx.createCtx(file, {require: require, console: console, logger: logger, aspen: aspen});
                }

                /* Append the Request and the Response Object to the current Context */
                ctx.request = req;
                ctx.response = res;

                /* Get the Page 1 and execute it */
                try {
                    fileCache[file]["1"].runInContext(ctx);
                    page0Ctx.createCtx(file, ctx);
                } catch (e) {
                    logger.warn("Executing Simplate Error in File " + file + ": " + e.message);
                    logger.debug(e.stack);
                    self.SimplateManager.error(req, res, 500);
                    return;
                }

                if (fileCache[file].mime.indexOf('text/') === 0) {
                    var out = mustache.render(fileCache[file]["2"], ctx);
                    res.setHeader("Content-Type", fileCache[file].mime);
                    res.statusCode = 200;
                    res.end(out);
                } else {
                    res.setHeader("Content-Type", fileCache[file].mime);
                    res.statusCode = 200;

                    if (typeof ctx.response.body !== "string") {
                        ctx.response.body = JSON.stringify(ctx.response.body);
                    }

                    res.end(ctx.response.body);
                }
            } else {
                fs.readFile(file, function (err, content) {
                    if (err) {
                        logger.warn("Could not read Simplate File " + file + ": " + err.message);
                        self.SimplateManager.error(req, res, 500);
                    } else {
                        /* Split the file into its pages */
                        pages = content.toString().split("^L");

                        /* Get page 0 and create a new context */
                        ctx = page0Ctx.createCtx(file, {require: require, console: console, logger: logger, aspen: aspen});

                        if (pages[0].trim() !== "") {
                            try {
                                pages[0] = vm.createScript(pages[0], file + ":p0");
                                pages[0].runInContext(ctx);
                                page0Ctx.createCtx(file, ctx);
                            } catch (e) {
                                logger.warn("Error in executing Init in File " + file + ": " + e.message);
                                logger.debug(e.stack);
                                self.SimplateManager.error(req, res, 500);
                                return;
                            }
                        }

                        fileCache[file] = {};

                        /* Store pages */
                        fileCache[file]["0"] = (typeof pages[0] !== undefined) ? pages[0] : "";

                        /* Try parsing page 1 */
                        try {
                            fileCache[file]["1"] = vm.createScript(pages[1], file + ":p1");
                        } catch (e) {
                            logger.warn("Parsing Simplate Error in File " + file + ": " + e.message);
                            logger.debug(e.stack);
                            self.SimplateManager.error(req, res, 500);
                            return;
                        }

                        if (pages.length > 2) {
                            fileCache[file]["2"] = pages[2];
                        }

                        /* Get the mime type for this file */
                        fileCache[file].mime = mime.lookup(file);

                        /* Change the timeout for this cache */
                        fileCache[file].timeout = (new Date()).getTime();

                        /* Append the Request and the Response Object to the current Context */
                        ctx.request = req;
                        ctx.response = res;

                        /* Execute Page 1 */
                        try {
                            fileCache[file]["1"].runInContext(ctx);
                            page0Ctx.createCtx(file, ctx);
                        } catch (e) {
                            logger.warn("Executing Simplate Error in File " + file + ": " + e.message);
                            logger.debug(e.stack);
                            self.SimplateManager.error(req, res, 500);
                            return;
                        }

                        if (fileCache[file].mime.indexOf('text/') === 0) {
                            var out = mustache.render(fileCache[file]["2"], ctx);
                            res.setHeader("Content-Type", fileCache[file].mime);
                            res.statusCode = 200;
                            res.end(out);
                        } else {
                            res.setHeader("Content-Type", fileCache[file].mime);
                            res.statusCode = 200;

                            if (typeof ctx.response.body !== "string") {
                                ctx.response.body = JSON.stringify(ctx.response.body);
                            }

                            res.end(ctx.response.body);
                        }
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
