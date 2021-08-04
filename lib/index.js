'use strict';
/*
    LiveChan is a live imageboard web application.
    Copyright (C) 2014 LiveChan Team

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
var fs = require('fs');
var http = require('http');
var https = require('https');
var format = require('util').format;
var path = require('path');

var express = require('express');
var logfmt = require('logfmt');
var mongoose = require('mongoose');
var { Server } = require('socket.io');
var Socket = require('./socket');
var tripcode = require('tripcode');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

var config = require('../config');
var socket_stream = require('socket.io-stream');
var chat_db = require('./models/chat');
var user_db = require('./models/user');

var root = path.join(__dirname, '..');
var salt_file = path.join(root, config.salt_file);
var ca_file = path.join(root, config.ssl.ca);
var key_file = path.join(root, config.ssl.key);
var cert_file = path.join(root, config.ssl.cert);

/* read secure tripcode salt */
fs.readFile(salt_file, 'utf8', function(err, data) {
    if (!err) {
        config.securetrip_salt = data;
    }
});

/* initialize app */
const {
	LIVECHAN_HOST,
	LIVECHAN_PORT,
  MONGO_USERNAME,
	MONGO_PASSWORD,
	MONGO_HOSTNAME,
	MONGO_PORT,
	MONGO_DB
} = process.env;
console.log(process.env);

var app = express();
var secure_port = 443;
if (LIVECHAN_PORT != 80) secure_port = 5443;

/* listen now */
var insecure_server = http.createServer(app).listen(LIVECHAN_PORT, LIVECHAN_HOST, function() {
    console.log('Express server (insecure) listening on port %d in %s mode',
        insecure_server.address().port, app.settings.env);
});

var server;
if (fs.existsSync(key_file) && fs.existsSync(cert_file) && false) {
    var options = {
        key: fs.readFileSync(key_file),
        cert: fs.readFileSync(cert_file)
    };
    if (fs.existsSync(ca_file)) {
        options.ca = fs.readFileSync(ca_file);
    }
    server = https.createServer(options, app).listen(secure_port, function() {
        console.log('Express server (secure) listening on port %d in %s mode',
            server.address().port,
            app.settings.env);
    });
} else {
    console.log('Missing certificate or private key');
    console.log('Running with insecure server');
    server = insecure_server;
}

/* set up db */
var db_addr = process.env.DB || 'livechan_db';

var mongo_url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(mongo_url);

/* logging only during development */
if (LIVECHAN_PORT == 180) {
    app.use(logfmt.requestLogger());
}

/* serve public data (/public/*) and get cookies */
app.use(express.static(path.join(root + '/public')));
app.use(express.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(expressSession({
    secret: 'keyboard-cat',
		resave: true,
		saveUninitialized: true,
}));

/* robots */
app.get('/robots.txt', function (req, res) {
			res.type('text/plain')
			res.send("User-agent: *\nDisallow: /");
});


function session_exists(session) {
    if (user_db.count({
            session_key: session
        })) {
        return true;
    }
    return false;
}


app.all('*', function(req, res, next) {
    if (!req.connection.encrypted && server !== insecure_server)
        res.redirect('https://' + req.host + (secure_port == 443 ? '' : ':' + secure_port) + req.url);
    else
        next();
});

/* Routes */
app.use('', require('./routes/api'));
app.use('', require('./routes/admin'));
app.use('', require('./routes/chat'));
app.use('', require('./routes/login'));
app.use('', require('./routes/youtube'));
app.use('', require('./routes/misc'));


Socket.io = new Server(server);

/* reduce logging */
// Socket.io.set('log level', 1);

/* join a chat room */
Socket.io.on('connection', function(socket) {
    socket.emit('request_location', "please return a chat room");
    socket.on('subscribe', function(data) {
        socket.join(data);
        Socket.io.in(data).emit('user_count', Socket.io.of(data).sockets.length);
    });
    socket.on('unsubscribe', function(data) {
        socket.leave(data);
        Socket.io.in(data).emit('user_count', Socket.io.of(data).sockets.length);
    });
    socket_stream(socket).on('upload', function(stream, data) {
        var filename = 'public/tmp/uploads2/' + path.basename(data.name);
        stream.pipe(fs.createWriteStream(filename));
    });
});
