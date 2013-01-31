http = require('http');
fs = require('fs');
peace = require('mustache');


cache = {};


server = http.createServer(function(req, res)
{
    fs_path = req.url.slice(1, req.url.length);
    console.log(fs_path);

    try {
        raw = fs.readFileSync(fs_path, 'UTF-8');
        parts = raw.split("^L");

        if (!(parts[0] in cache))
        {
            cache[parts[0]] = null;
            eval(parts[0]);
        }

        (function ()
        {
            eval(parts[1]);
            out = peace.render(parts[2], global);
            console.log(out);
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
