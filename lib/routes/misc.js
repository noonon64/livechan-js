'use strict';

var express = require('express');
var router = new express.Router();

var config = require('../../config');
var root = config.root;

router.get('/', function (req, res) {
    res.redirect('/chat/home');
});

/* 404 */
router.get('*', function(req, res){
    res.status(404).sendFile('pages/404.html', {root});
});

/* 404 */
router.post('*', function(req, res){
    res.status(404).sendFile('pages/404.html', {root});
});

module.exports = router;
