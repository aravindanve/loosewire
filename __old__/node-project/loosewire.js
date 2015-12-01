/*
 *
 * loosewire app
 * by @aravindanve
 *
 * usage: node loosewire.js [port:3000] [file:./project.lw.json]
 */

var fs = require('fs'),
    http = require('http'),
    args = process.argv.slice(2),

    _port = 3000,
    _file = false,
    _server = null,
    quoteRegExp = function (str) {
        return (str+'').replace(
            /[.?*+^$[\]\\(){}|-]/g, "\\$&");
    },
    withArg = function (name, next) {
        if ('string' === typeof name &&
            'function' === typeof next) {
            for (i in args) {
                var _regexp = RegExp(
                    '^' + quoteRegExp(name + ':'), 'gi');

                if (args[i].match(_regexp)) {
                    return next.apply(this, next, [
                        args[i].replace(_regexp), '')]);
                }
            }
            return next.apply(this, next, [false]);
        } else {
            return false;
        }
    },
    withFile = function (name, next, err) {
        if ('string' === typeof name &&
            'function' === typeof next) {
            return withArg('file', function (file) {
                fs.readFile()
            });
        } else {
            return false;
        }
    }
    configure = function () {
        // load settings
        withArg('port', function (port) {
            if ((false !== port) && !isNaN(parseInt(port))) {
                _port = port;
            } else {
                // invalid port
            }
        });

        // load project file
        withArg('file', function (file) {
            fs.readFile(file, 'utf-8', function (err, data) {

            });
        });

        var args = process.argv.slice(2);

        // load settings
        for (i in args) {
            if (args[i].match(/^port\:/i)) {
                tempPort = parseInt(args[i]
                    .replace(/^port\:/i, ''));

                if (!isNaN(tempPort)) {
                    _port = tempPort;
                } else {
                    return console.log('Invalid port: ' + args[i]);
                }
            }
        }

        // load project file
        for (i in args) {
            if (args[i].match(/^file\:/i)) {
                tempFile = args[i].replace(/^file\:/i, '');
                fs.readFile(tempFile, 'utf-8', function (err, data) {
                    if (err) {
                        return console.log(
                            'Error opening file: ' + tempFile);
                    } 
                    _file = data;
                    start();
                });
                return;
            }
        }

        // no file specified, start app
        start();
    },
    start = function () {
        _server = http.createServer(
            handleRequest).listen(_port);

        // print app url in console
        console.log('Loosewire is running [Cmd + C to exit]\n' + 
            'Goto: http://127.0.0.1:' + _port + '/');
    },
    handleRequest = function (req, res) {
        var headers = req.headers,
            method = req.method,
            url = req.url,
            body = [];

        req.on('error', function (err) {
            console.error(err);
        }).on('data', function (chunk) {
            body.push(chunk);
        }).on('end', function () {
            body = Buffer.concat(body).toString();
            routeRequest(method, url, req, res);
        });
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write(_file);
        res.end('Hello World\n');
    },
    ;

// begin
configure();



// eof