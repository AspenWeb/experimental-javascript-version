http = require('http');
fs = require('fs');
mustache = require('mustache');
url = require('url');
path = require('path');

cache = {};
codes = {"404": "Not found, program!"};

function fail(res, code)
{
    res.statusCode = code;
    res.write(codes[code.toString()]);
    res.end()
}

server = http.createServer(function(req, res)
{
    var fs_path = url.parse(req.url).pathname.slice(1, req.url.length);

    fs_path = path.resolve(fs_path);
    console.log('stating' + fs_path);
    fs.stat(fs_path, function(err, stats)
    {
        if (err) return fail(res, 404)

        if (stats.isDirectory())
            fs_path += '/index.html';

        console.log('serving' + fs_path);
        fs.readFile(fs_path, 'UTF-8', function (err, raw)
        {
            if (err) return fail(res, 404)

            var pages = raw.split("^L");
            while (pages.length < 3)
                pages.unshift('');

            // Run page 0 if we haven't yet.
            if (!(pages[0] in cache))
            {
                cache[pages[0]] = null;
                eval(pages[0]);
            }

            (function ()
            {
                // Run page 1.
                eval(pages[1]);

                // Render template page.
                var out = mustache.render(pages[2], global);

                res.write(out);
                res.end();
            })();
        });
    });

})

console.log("Greetings, program! Welcome to port 8080.");
server.listen(8080);
