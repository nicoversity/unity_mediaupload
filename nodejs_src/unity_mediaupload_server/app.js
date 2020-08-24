/*
 * app.js (as part of UnityMediaUpload server)
 *
 * Description: Overall app.js server configuration. Additional configuration and server setup via "bin/www".
 *
 * Supported Node.js: 4.2.6 (tested)
 *
 * Author: Nico Reski
 * Web: https://reski.nicoversity.com
 * Twitter: @nicoversity
 * GitHub: https://github.com/nicoversity
 * 
 */

// general server variables
//
var express = require('express');
var path = require('path');
global.appRoot = path.resolve(__dirname);
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// configured server routes
//
var routes = require('./routes/index');
var unityMediaUpload = require('./routes/unitymediaupload');    // <-- Unity Media Upload implementation


// overall server setup via express
//
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ parameterLimit: 100000, limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/umu', unityMediaUpload);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
