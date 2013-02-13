/**
 * @file ContextManager to hold and handle all contexts that are needed for the Aspen
 * @author Fabian Faßbender
 * @version 1
 * @module lib/ContextFactory
 */

/**
 * @requires module:contextify Contextify is used to create Contexts and run scripts in it
 */
var contextify = require('contextify');


/**
 * Creates a new ContextFactory.
 * @constructor
 */
function ContextFactory() {
    "use strict";

    /**
     * @property {Object} this._ctx Holds all contexts
     */
    this._ctx = {};
}

/**
 * Returns wether or not a context exists for the file
 * @param {String} file File to check
 * @returns {Boolean} True if Context exists, False if not
 */
ContextFactory.prototype.checkForCtx = function (file) {
    "use strict";

    if (typeof this._ctx[file] !== "undefined") {
        return true;
    } else {
        return false;
    }
};

/**
 * Creates or overrides a context for a file
 * @param {String} file File to create a Context for
 * @param {Object} context Context variables that are passed into that context
 * @returns {Object} The created context
 */
ContextFactory.prototype.createCtx = function (file, context) {
    "use strict";

    var newCtx = contextify(context);
    this._ctx[file] = context;
    return newCtx;
};

/**
 * Returns the context of a File or false
 * @param {String} file File that the context belongs to
 * @returns {Object|Boolean} If context exists, the context is given back otherwise false is given
 */
ContextFactory.prototype.getCtx = function (file) {
    "use strict";

    if (typeof this._ctx[file] !== "undefined") {
        return this._ctx[file];
    } else {
        return false;
    }
};

/**
 * Deletes the context for a file
 * @param {String} file File to delete the Context for
 */
ContextFactory.prototype.deleteCtx = function (file) {
    "use strict";

    delete this._ctx[file];
};

module.exports = ContextFactory;