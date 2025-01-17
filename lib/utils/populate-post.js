'use strict';

var fs = require('fs');
var get_user_ip = require('./get-user-ip');
var bcrypt = require('bcrypt');

/* populate_post:
    - converts a POST request into a data object with fields:
        chat, convo, body, name, date, ip
        image, image_filename, image_filesize (if file uploaded)
    calls callback(err) on completion
*/
module.exports = function(req, data, callback) {
    /* TODO: remove this try catch */
    try {
        if (!req.body) {
            return callback(new Error('no request body'));
        }
        /* populate initial post details */
        data.chat = req.params.id;
        data.convo = req.body.convo || "General";
        data.body = req.body.body || "";
        data.name = req.body.name || "Anonymous";
        data.date = (new Date()).toString();
        data.ip = get_user_ip(req);
        var salt = '$2a$10$mAM0oYrjp0bCHFDsGaiB.e';
        var identifier = bcrypt.hashSync(data.ip, salt);
        data.identifier = identifier;

        /* populate initial file details */
        if (req.file &&
            req.file.size === 0) {

            /* no file uploaded */
            if (/^\s*$/.test(req.body.body)) {

                return callback(new Error('nothing substantial submitted'));
            } else {
                /* delete blank file */
                if (req.file) {

                    return fs.unlink(req.file.path, function(err) {
                        if (err) {
                            console.log('error deleting blank file', err);
                        }

                        return callback();
                    });
                } else {
                    console.log('couldn\'t find blank file');
                    return callback();
                }

            }
        } else if (!req.file) {
            return callback();
        } else {
            /* file exists; record path, name, and size */
            data.image = req.file.path;
            data.image_filename = req.file.originalname;
            data.image_filesize = req.file.size;
            return callback();
        }

    } catch (e) {
        console.log('request parsing error', e);
        return callback(new Error('illegitimate_request'));
    }
};
