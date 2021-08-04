'use strict';

var config = require('../../config');
var get_extension = require('./get-extension');

module.exports = function(filename) {
    var extension = get_extension(filename);
    if (config.image_formats.includes(extension)) return 'image';
    if (config.video_formats.includes(extension)) return 'video';
    if (config.audio_formats.includes(extension)) return 'audio';
    return 'invalid';
};

