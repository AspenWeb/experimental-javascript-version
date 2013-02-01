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
    "dir": "www",
    "index": "index.html"
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


server = http.createServer(function(req, res) {
    var fs_path = url.parse(req.url).pathname.slice(1, req.url.length);
    fs_path = path.resolve(config.dir + path.sep + fs_path);

    if (fs_path.indexOf(cwd) !== 0) {
        // They gave us ../../..
        return fail(res, 400);
    }

    console.log('stating: ' + fs_path);
    fs.readFile(fs_path, function(err, raw) {
            console.log('serving: ' + fs_path);
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
    });

}).listen(8080);

console.log("Greetings, program! Welcome to port 8080.");
