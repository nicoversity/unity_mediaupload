/*
 * index.js (as part of UnityMediaUpload server)
 *
 * Description: Implementation of index.js route on the server.
 *
 * Supported Node.js: 4.2.6 (tested)
 *
 * Author: Nico Reski
 * Web: https://reski.nicoversity.com
 * Twitter: @nicoversity
 * GitHub: https://github.com/nicoversity
 * 
 */

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Unity_MediaUpload Node.js server' });
});

module.exports = router;
