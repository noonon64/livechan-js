'use strict';

var fs = require('fs');
var async = require('async');

var express = require('express');
var router = new express.Router();

var config = require('../../config');
var upload = require('../utils/upload');
var root = config.root;
var check_ip_validity = require('../utils/check-ip-validity');
var populate_post = require('../utils/populate-post');
var rotate_image = require('../utils/rotate-image');
var format_image = require('../utils/format-image');
var generate_thumbnail = require('../utils/generate-thumbnail');
var format_post = require('../utils/format-post');
var format_special = require('../utils/format-special');
var add_to_chat = require('../utils/add-to-chat');

var user_db = require('../models/user');
var crypto = require('crypto');

router.get('/chat/:id([a-z0-9]+)', function(req, res) {
    if (!config.boards.includes(req.params.id) && req.params.id !== 'home') {
        res.send('Board doesn\'t exist :(');
        return;
    }
    res.sendFile('pages/index.html', {root});
});

/*
router.get('/chat_beta/:id([a-z0-9]+)', function(req, res) {
    if (!config.boards.includes(req.params.id) && req.params.id !== 'home') {
        res.send('Board doesn\'t exist :(');
        return;
    }
    res.sendFile('pages/index_beta.html', {root});
});
*/

router.post('/chat/:id([a-z0-9]+)', upload.single('image'), function(req, res, next) {
    res.type('text/plain');

    /* to be stored in db and passed to clients */
    var data = {};

    async.series([
        function(callback) {
            if (req.params.id !== "all" && !config.boards.includes(req.params.id)) {
                return callback(new Error('This board does not exist.'));
            } else {
								if (config.flag_boards.includes(req.params.id)) {
                    data.special = "country";
                    return callback();
								} else {
                		data.special = "country";
                		return callback();
								}
            }

        },
        check_ip_validity.bind(null, req),
        populate_post.bind(null, req, data),
        rotate_image.bind(null, data),
        format_image.bind(null, data),
        generate_thumbnail.bind(null, data),
        format_post.bind(null, data),
        format_special.bind(null, req, data),
        (function(data, callback){
        	if (data.chat != 'General' && data.chat != '') {
	        	return callback();
        	}
	        var chat = {};
	        chat.name = data.trip ? data.name + data.trip : data.name;
	        chat.name = chat.name ? chat.name : 'Anonymous';
					chat.name = chat.name.replace(/!/g, '#');
	        chat.name = chat.name.replace(/\ /g, '_');
	        chat.body = data.body.replace(/\n/g, ' ');
	        chat.body = chat.body.replace(/\r/g, ' ');
	        chat.body = chat.body.replace(/\t/g, ' ');
	        if (data.image) {
	            var base_name = data.image.match(/[\w\-\.]*$/)[0];
	            var extension = base_name.match(/\w*$/)[0];
	            var url_file = 'https://livechan.net/tmp/uploads/' + base_name;
	            chat.body = url_file + ' ' + chat.body;
	        }
	        return callback();
        }).bind(null, data),
        add_to_chat.bind(null, data),
    ], function(err) {
        if (err) {
            res.json({failure: err.message});
            /* delete file */
            if (req.files && req.files.image && req.files.image.path) {
                fs.unlink(req.files.image.path, function(e) {
                    if (e) console.log('error deleting image', e);
                });
            }
            /* delete thumbnail */
            if (data.thumb) fs.unlink(data.thumb, function(e) {
                if (e) console.log('error deleting thumbnail', e);
            });
            return;
        }

        /* give the client information about the post */
        res.json({
            success: 'success_posting',
            id: data.count
        });
    });
});

router.get('/draw', function(req, res, next) {
    res.sendFile('pages/draw.html', {root});
});

router.get('/draw/:id([a-z0-9]+)', function(req, res, next) {
    res.sendFile('pages/draw.html', {root});
});

router.get('/:id([a-z0-9]+)', function(req, res) {
    res.redirect('/chat/'+req.params.id);
});

module.exports = router;
