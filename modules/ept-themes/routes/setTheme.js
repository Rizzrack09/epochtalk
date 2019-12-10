var Promise = require('bluebird');
var path = require('path');
var Joi = require('@hapi/joi');
var fs = require('fs');
var sass = require(path.join(__dirname + '/../../../scripts', 'tasks', 'sass'));
var copyCss = require(path.join(__dirname + '/../../../scripts', 'tasks', 'copy_files'));
var common = require(path.normalize(__dirname + '/common'));
var customVarsPath = common.customVarsPath;
var previewVarsPath = common.previewVarsPath;
var defaultVarsPath = common.defaultVarsPath;
/**
  * @apiVersion 0.4.0
  * @apiGroup Settings
  * @api {PUT} /theme (Admin) Set Theme
  * @apiName SetTheme
  * @apiDescription Used to set theme vars in _custom-variables.scss
  *
  * @apiParam (Payload) {string} base-line-height Base line height for entire forum
  * @apiParam (Payload) {string} base-background-color The background color for the entire forum
  * @apiParam (Payload) {string} color-primary The primary color for the forum, used for buttons, etc...
  * @apiParam (Payload) {string} base-font-sans Font family for the entire forum
  * @apiParam (Payload) {string} base-font-color Base font color for entire forum
  * @apiParam (Payload) {string} base-font-size Base font size for entire forum
  * @apiParam (Payload) {string} secondary-font-color Secondary font color, used for description text
  * @apiParam (Payload) {string} input-font-color Font color for input fields
  * @apiParam (Payload) {string} input-background-color Background color for all input fields
  * @apiParam (Payload) {string} border-color Color for all borders used in the forum
  * @apiParam (Payload) {string} header-bg-color Color for the forum header background
  * @apiParam (Payload) {string} header-font-color Font color for the forum header
  * @apiParam (Payload) {string} sub-header-color Color for sub headers and footers
  *
  * @apiSuccess {string} base-line-height Base line height for entire forum
  * @apiSuccess {string} base-background-color The background color for the entire forum
  * @apiSuccess {string} color-primary The primary color for the forum, used for buttons, etc...
  * @apiSuccess {string} base-font-sans Font family for the entire forum
  * @apiSuccess {string} base-font-color Base font color for entire forum
  * @apiSuccess {string} base-font-size Base font size for entire forum
  * @apiSuccess {string} secondary-font-color Secondary font color, used for description text
  * @apiSuccess {string} input-font-color Font color for input fields
  * @apiSuccess {string} input-background-color Background color for all input fields
  * @apiSuccess {string} border-color Color for all borders used in the forum
  * @apiSuccess {string} header-bg-color Color for the forum header background
  * @apiSuccess {string} header-font-color Font color for the forum header
  * @apiSuccess {string} sub-header-color Color for sub headers and footers
  *
  * @apiError (Error 500) InternalServerError There was an issue setting the theme.
  */
module.exports = {
  method: 'PUT',
  path: '/api/theme',
  options: {
    auth: { strategy: 'jwt' },
    plugins: {
      mod_log: {
        type: 'adminSettings.setTheme',
        data: { theme: 'payload' }
      }
    },
    validate: {
      payload: Joi.object({
        'base-line-height': Joi.string(),
        'base-background-color': Joi.string(),
        'color-primary': Joi.string(),
        'base-font-sans': Joi.string(),
        'base-font-color': Joi.string(),
        'base-font-size': Joi.string(),
        'secondary-font-color': Joi.string(),
        'input-font-color': Joi.string(),
        'input-background-color': Joi.string(),
        'border-color': Joi.string(),
        'header-font-color': Joi.string(),
        'sub-header-color': Joi.string(),
        'header-bg-color': Joi.string()
      })
    },
    pre: [ { method: (request) => request.server.methods.auth.themes.setTheme(request.server, request.auth) } ]
  },
  handler: function(request) {
    var theme = request.payload;
    var keys = Object.keys(theme);
    var stream = fs.createWriteStream(customVarsPath);

    return new Promise(function(resolve, reject) {
      stream.once('open', function() {
        keys.forEach(function(key) {
          stream.write('$' + key + ': ' + theme[key].toLowerCase() + ';\n');
        });
        stream.end();
      })
      .on('close', function() {
        fs.truncateSync(previewVarsPath, 0); // wipe preview vars file
        copyCss()
        .then(sass)
        .then(function() { return resolve(theme); })
      })
      .on('error', reject);
    })
    .error(request.errorMap.toHttpError);
  }
};
