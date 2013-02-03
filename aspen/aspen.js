var mime = require('mime'),
    mustache = require('mustache'),
    mime = require('mime'),
    mustache = require('mustache'),
    utils = require('./utils.js'),
    logger = require('./logger.js');

var config = require('../.aspen/config.json');

exports.config = config;

/*
 * Pass in a simplate path and a context (stuff like res,req)
 */
exports.render = function(simplate, context) {
    logger.debug('Request: ' + simplate);
    var content_type = mime.lookup(simplate);
    res = context.res;

    fs.readFile(simplate, function (err, raw) {
        if (err) return fail(res, 404, err);

        //Check encoding of the file
        if (utils.check_encoding(raw) == 'utf8') {
            var pages = raw.toString("utf8").split("^L");

            while (pages.length < 3) {
                pages.unshift('');
            }

            // Run page 0 if we haven't yet.
            if (!(pages[0] in cache)) {
                cache[pages[0]] = null;
                eval(pages[0]);
            }

            (function () {
                // Run page 1.
                eval(pages[1]);

                var out = pages[2];
                if (content_type.indexOf('text/') === 0) {
                    var out = mustache.render(out, global);
                }

                res.setHeader('Content-Type', content_type);
                res.write(out);
                res.end();
            })();
        } else {
            //It is not utf8 so send the buffer as binary data
            res.end(raw);
        }
        logger.debug('Sent: ' + simplate);
    });
};

exports.logger = logger;