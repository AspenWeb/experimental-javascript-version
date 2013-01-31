http = require('http');
fs = require('fs');
peace = require('mustache');

cache = {};

server = http.createServer(function(req, res)
{
    var fs_path = req.url.slice(1, req.url.length);
    console.log("serving " + fs_path);

    try {
        var raw = fs.readFileSync(fs_path, 'UTF-8');
        var parts = raw.split("^L");

        if (!(parts[0] in cache))
        {
            cache[parts[0]] = null;
            eval(parts[0]);
        }

        (function ()
        {
            eval(parts[1]);
            var out = peace.render(parts[2], global);
            res.write(out);
        })();

    } catch (err) {
        console.log(err);
        res.statusCode = 404;
        res.write("Not found, program!");
    }
    res.end();
})

server.listen(8080);
