fs = require('fs');
http = require('http');
path = require('path');
url = require('url');

mime = require('mime');
mustache = require('mustache');


cache = {};
codes = {
    "400": "Bad request, program!",
    "404": "Not found, program!"
};

config = {
    "simplates": {
        "defaults": "aspen"+path.sep+"simplates"
    },
    "dir": "www",
    "index": "index.html",
    "autoindex": true,
    "port": 8080
};

cwd = process.cwd();


function fail(res, code) {
    res.statusCode = code;
    res.write(codes[code.toString()]);
    res.end();
}

function checkEncoding (buffer) {
    var contentStartUTF8 = buffer.toString('utf8', 0, 24),
        encoding = 'utf8',
        i,
        charCode;

    for (i = 0; i < contentStartUTF8.length; i += 1) {
        charCode = contentStartUTF8.charCodeAt(i);
        if (charCode == 65533 || charCode <= 8) {
            console.log("Encoding CharCode: " + charCode);
            encoding = 'binary';
            break;
        }
    }

    return encoding;
}

function render_simplate(simplate, res) {
    var content_type = mime.lookup(simplate);

    fs.readFile(simplate, function(err, raw) {
        console.log('serving: ' + simplate);
        if (err) return fail(res, 404);

        //Check encoding of the file
        if (checkEncoding(raw) == 'utf8') {
            var pages = raw.toString("utf8").split("^L");

            while (pages.length < 3) {
                pages.unshift('');
            }

            // Run page 0 if we haven't yet.
            if (!(pages[0] in cache)) {
                cache[pages[0]] = null;
                eval(pages[0]);
            }

            (function() {
                // Run page 1.
                eval(pages[1]);

                // Render template page.
                var out = pages[2];
                if (content_type.indexOf('text/') === 0)
                    var out = mustache.render(out, global);

                res.setHeader('Content-Type', content_type);
                res.write(out);
                res.end();
            })();
        } else {
            //It is not utf8 so send the buffer as binary data
            res.end(raw);
        }
    });
}

server = http.createServer(function(req, res) {

    var aspen_root = __dirname;
    var fs_path = url.parse(req.url).pathname.slice(1, req.url.length);
    fs_path = path.resolve(config.dir + path.sep + fs_path);


    if (fs_path.indexOf(cwd) !== 0) {
        // They gave us ../../..
        return fail(res, 400);
    }

    console.log('stating: ' + fs_path);
    fs.stat(fs_path, function(err, stats) {
        var simplate;

        if (err) return fail(res, 404);

        if(stats.isDirectory()) {
            var index_path = fs_path + path.sep + config.index;
            fs.exists(index_path, function(exists) {
                simplate = index_path;
                if(exists === false) {
                    simplate = aspen_root + path.sep + config.simplates.defaults + path.sep + 'autoindex.html';
                }
                // Now that we have simplate, let's do something!

                render_simplate(simplate, res);

            });
        } else {
            // Not a directory, we want a file, easy peasey!
            render_simplate(simplate, res);
        }
        /*

        if (stats.isDirectory()) {
            var tmp_simp;
            console.log(new_path);

            fs.existsSync(new_path, function(exists) {
                if(exists === true) {
                    tmp_simp = new_path;
                    console.log('exists ' + tmp_simp);
                } else {
                    // Serve up autoindex simplate
                    tmp_simp = fs_path + path.sep + config.simplates.defaults + path.sep + 'autoindex.html';
                    console.log('autoindex ' + tmp_simp);
                }
                simplate = tmp_simp;
            });
            simplate = tmp_simp;
            console.log('finished ' +simplate);
        } else {
            simplate = fs_path;
        }
        console.log('simplate: ' + simplate);
        */

    });

}).listen(config.port);

console.log("Greetings, program! Welcome to port "+config.port+".");
