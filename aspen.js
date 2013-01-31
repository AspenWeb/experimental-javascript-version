http = require('http');
fs = require('fs');
peace = require('mustache');

cache = {};

server = http.createServer(function(req, res)
{
    var fs_path = req.url.slice(1, req.url.length);
    console.log("serving " + fs_path);

    fs.readFile(fs_path, 'UTF-8', function (err, raw)
    {
        if (err)
        {
            res.statusCode = 404;
            res.write("Not found, program!");
        }
        else
        {
            var parts = raw.split("^L");

            // Run page 1 if we haven't yet.
            if (!(parts[0] in cache))
            {
                cache[parts[0]] = null;
                eval(parts[0]);
            }

            (function ()
            {
                // Run page 2.
                eval(parts[1]);

                // Render template page.
                var out = peace.render(parts[2], global);

                res.write(out);
            })();
        }
        res.end();
    });
})

console.log("Greetings, program!");
server.listen(8080);
