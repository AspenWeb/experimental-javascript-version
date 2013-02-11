/**
 * @file The Core of Aspen
 * @author Fabian Faßbender
 * @version 1
 * @module Core
 */

/**
 * @requires lib/logger/index Logger
 */
var Logger = require('./lib/logger/index');

/**
 * @requires lib/Utils Various Utils
 */
var Utils = require('./lib/Utils');

/**
 * @requires lib/SimplateManager To handle all System Templates
 */
var SimplateManagerReq = require('./lib/SimplateManager');

/**
 * @requires lib/AspenParser To parse the Simplates
 */
var AspenParserReq = require('./lib/AspenParser');

/**
 * @requires lib/logger/index The Logger from Aspen
 * @type {Object}
 */
var logger = require('./lib/logger/index');

/**
 * @requires module:mime Mime tells you the type of a file
 */
var mime = require('mime');

/**
 * @requires module:http The NodeJS HTTP Module to handle HTTP Requests
 */
var http = require('http');

/**
 * @requires module:url The NodeJS URL Module for parsing URLs
 */
var url = require('url');

/**
 * @requires module:path The NodeJS PATH Module for handling PATHs
 */
var path = require('path');

/**
 * @requires module:fs The NodeJS FS Module for FS i/o
 */
var fs = require('fs');

/* Setup the SimplateManager and the AspenParser */
var AspenParser = new AspenParserReq();
var SimplateManager = new SimplateManagerReq();

AspenParser.appendSimplateManager(SimplateManager);
SimplateManager.appendAspenParser(AspenParser);

/**
 * Creates a new Aspen Core
 * @constructor
 */
function Core(listeningCB) {
    "use strict";

    Logger.info("Starting Aspen.JS Framework...");

    /* Check if a listening callback has been given */
    if (typeof listeningCB !== "function") {
        listeningCB = function () {};
    }

    /**
     * @property {Object} this.config Holds the current Config
     */
    this.config = require('./config.json');

    /**
     * @property {Object} this._httpServer Holds the HTTP Server where the Requests come in
     */
    this._httpServer = http.createServer(this._handleRequest.bind(this)).listen(this.config.network.port, this.config.network.ip, listeningCB);

    /**
     * @property {String} this._cwd Holds the current Workdir
     */
    this._cwd = process.cwd();
}

/**
 * Callback for processing a incoming HTTP Request
 * @param {Object} req The request that comes in
 * @param {Object} res The esponse that is send to the Client
 */
Core.prototype._handleRequest = function (req, res) {
    "use strict";

    /* Check if Request Path is in valid cwd */
    var fs_path = path.resolve(this.config.www_root + path.sep + url.parse(req.url).pathname.slice(1, req.url.length)),
        self = this;

    if (fs_path.indexOf(this._cwd) !== 0) {
        /* It is outside the bounds */
        SimplateManager.error(req, res, 400);
    } else {
        req.fsPath = fs_path;

        fs.stat(fs_path, function (err, stat) {
            if (err) {
                logger.info("Could not find Ressource: " + fs_path);
                SimplateManager.resolveWWW(req, res, fs_path);
            } else {
                if (stat.isFile()) {
                    if (self.config.simplateTypes.indexOf(path.extname(fs_path)) !== -1) {
                        AspenParser.parse(req, res, fs_path);
                    } else {
                        res.statusCode = 200;
                        fs.createReadStream(fs_path).pipe(res);
                    }
                } else {
                    SimplateManager.autoIndex(req, res, fs_path);
                }
            }
        });
    }
};

module.exports = Core;