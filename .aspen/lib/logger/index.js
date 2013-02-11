/**
 * @file Logger with Patterns and Writers
 * @author Fabian Faßbender
 * @version 1
 * @module lib/logger/index
 */

/**
 * @requires config.json The global config for Aspen
 * @type {Object}
 */
var config = require('../../config.json');

/**
 * @requires module:util The NodeJS Util Module for inheriting Objects
 * @type {Object}
 */
var util = require('util');

/**
 * @requires module:events The NodeJS events Module for emitting Events
 * @type {Object}
 */
var events = require('events');

/**
 * @requires module:async The npmjs.org async Module for async Control Flow
 * @type {Object}
 */
var async = require('async');

/**
 * Options for the Logger
 * @type {Object}
 */
var options = null;

/**
 * Build up a new Logger
 * @param {Object} parOptions Options for the Logger
 * @constructor
 */
function Logger(parOptions) {
    "use strict";

	/* Bind this to the EventEmitter */
	events.EventEmitter.call(this);


    options = parOptions;


    this.startTime = process.hrtime();

    /* Loading all Formatpatterns */
    this.formats = require('./format/')(this);

	/* Load all Writers */
    function afterWriterLoaded(err) {
        if (err) {
            throw err;
        }
    }

	async.map(options.writer, this.loadWriter.bind(this), afterWriterLoaded);

    /* Setup Logging functions */
    options.availableLevels.forEach(function (level) {
        if (options.enabledLevels.indexOf(level) !== -1) {
            Logger.prototype[level] = function (message) {
                this.parseAndEmit(message, level);
            };
        } else {
            Logger.prototype[level] = function () { };
        }
    });
}

/* Inherit the Events Prototype to the Logger */
util.inherits(Logger, events.EventEmitter);

/**
 * Function that loads an inits a Writer
 * @param {String} file The Writer file
 * @param {Logger~afterWriterLoaded} cb Gets called after a file has loaded
 */
Logger.prototype.loadWriter = function (file, cb) {
    "use strict";

    require('./writer/' + file)(this, function () {
        cb(null, true);
    });
};

/**
 * RegExp for finding the pattern in a Format
 * @type {RegExp}
 */
var regex = /(?:\{([a-z0-9,= ]+)\})?%([a-z]+)%/img;

/**
 * Cache for the format functions that are already parsed
 * @type {Object}
 */
var formatCache = {};

/**
 * Parses and emits a new Logmessage to all Writers
 * @param {String} message The message that should be logged
 * @param {String} level The log level
 */
Logger.prototype.parseAndEmit = function (message, level) {
    "use strict";

    if (typeof formatCache[level] === 'undefined') {
        var format = (typeof options[level] !== 'undefined' && typeof options[level].format === 'string') ? options[level].format : options.format,
            self = this,
            formatFunction = this.getFormatFunction(format);

        formatCache[level] = new Function("message", "level", formatFunction).bind(self);
    }

    var line = formatCache[level](message, level);
    this.emit("newLine", line);
};

/**
 * Creates a new Format Function that gets executed everytime a message for that Loglevel comes
 * @param {String} format The Format String that should be parsed
 * @return {String}
 */
Logger.prototype.getFormatFunction = function (format) {
    "use strict";

    var self = this;

    return "return \"" + format.replace(regex, function (fullMatch, matchOptions, formatPattern) {
        /* Check if this pattern exists */
        if (typeof self.formats[formatPattern] === 'function') {
            /* Parse pattern options */
            if (typeof matchOptions === 'undefined') {
                matchOptions = [];
            } else {
                var tmpOptions = {};

                /* Options are <key>=<value>, <key>=<value>,<key>=<value> */
                matchOptions.split(",").forEach(function (option) {
                    var optionPair = option.trim().split("=");
                    tmpOptions[optionPair[0]] = optionPair[1];
                });

                matchOptions = tmpOptions;
            }

            return "\" + this.formats." + formatPattern + "(message, level, " + JSON.stringify(matchOptions) + ") + \"";
        } else {
            /* If Pattern was not found return the patternString */
            return fullMatch;
        }
    }) + "\";";
};

/**
 * Create a singleton
 * @type {Logger}
 */
var instance = new Logger(config.logger);
module.exports = instance;

/**
 * Callback that tells async to move on in the map
 * @callback Logger~afterWriterLoaded
 * @param {object} error NUll if no error, object if error
 * @param {boolean} loaded True if loaded, false if not
 */