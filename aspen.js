fs = require('fs');
http = require('http');
path = require('path');
url = require('url');

var aspen = require('./aspen/aspen.js');

cache = {};
cwd = process.cwd();


// @TODO send errors to simplate
function fail(res, code, err) {
    aspen.logger.error(err);

    res.statusCode = code;
    aspen.render(aspen.config.aspen_root + path.sep + "www" + path.sep + 'error.html', {res:res});
}



server = http.createServer(function (req, res) {

    var aspen_root = __dirname;
    var fs_path = url.parse(req.url).pathname.slice(1, req.url.length);
    fs_path = path.resolve(aspen.config.www_root + path.sep + fs_path);


    if (fs_path.indexOf(cwd) !== 0) {
        // They gave us ../../..
        return fail(res, 400);
    }

    fs.stat(fs_path, function (err, stats) {
        var simplate;

        if (err) return fail(res, 404);

        if (stats.isDirectory()) {
            // @todo: add support for multiple indicies
            var index_path = fs_path + path.sep + aspen.config.indices[0];

            fs.exists(index_path, function (exists) {
                simplate = index_path;
                if (exists === false) {
                    simplate = aspen.config.aspen_root + path.sep + "www" + path.sep + 'autoindex.html'
                }

                // Now that we have simplate, let's do something!
                aspen.render(simplate, {res:res});
            });
        } else {
            // Not a directory, we want a file, easy peasey!
            simplate = fs_path;
            aspen.render(simplate, {res:res});
        }

    });

}).listen(aspen.config.network_port, aspen.config.network_address);

aspen.logger.log("Greetings, program! Welcome to " + aspen.config.network_address + ":" + aspen.config.network_port + ".");
