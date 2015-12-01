// loosewire

var fs = require('fs'),
    http = require('http'),
    args = process.argv.slice(2),

    _port = 3000,
    _file = false,
    _server = null,

    _regEsc = function (str) {
        return (str + '').replace(
            /[.?*+^$[\]\\(){}|-]/g, "\\$&"
        );
    },
    _apply = function (next) {
        if ('function' !== typeof next) {
            return console.error('Argument is not a function');
        }
        _arguments = [];
        for (var i = 1; i < arguments.length; i++) {
            _arguments.push(arguments[i]);
        }
        return next.apply(this, _arguments);
    },
    _withArg = function (label, next) {
        var labelReg = RegExp('^' + regEsc(name + ':'), 'gi');
        for (i in args) {
            if (args[i].match(labelReg)) {
                return _apply(
                    next, args[i].replace(labelReg, '')
                );
            }
        }
        return false;
    },
    _readFile = function (name, next, err) {
        err = err || function () {
            return console.error('Error reading file: ' + name);
        };
        fs.readFile(name, 'utf-8', function (err, data) {
            if (err) {
                return _apply(err);
            }
            _apply(next, data);
        });
    },
    _configure = function () {
        _withArg('port', function (port) {
            port = parseInt(port);
            if (!isNaN(port)) {
                _port = port;
            } else {
                return console.error('Invalid port' + port);
            }
        });

        var hasFileArg = _withArg('file', function (filename) {
            _readFile(filename, function (data) {
                _file = file;
                _start();
            });
        });

        if (!hasFileArg) {
            _start();
        }
    },
    _start = function () {
        _server = http.createServer(_requests).listen(_port);
        console.log('loosewire is running, Cmd + C to quit\n' +
            'url: http://127.0.0.1:' + _port + '/');
    },
    _requests = function (req, res) {
        var body = [];

        req.on('error', function (err) {
            console.error(err);
        }).on('data', function (chunk) {
            body.push(chunk);
        }).on('end', function () {
            body = Buffer.concat(body).toString();
            _route(req, res, body);

            // ?
        });
    },
    _route = function (req, res, data) {
        var headers = req.headers,
            method = req.method,
            url = req.url;

        if (_routes)
    },
    _routes = {
        '/': function (req, res, data) {

        },
        '/load': function (req, res, data) {

        },

    };

// routes
router.all('/', function (req, res, next) {

}); 

// begin
_configure();
























