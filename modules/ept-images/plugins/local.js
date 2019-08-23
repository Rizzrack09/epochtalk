var local = {};
module.exports = local;

var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');
var Boom = require('boom');
var mmm = require('mmmagic');
var crypto = require('crypto');
var request = require('request');
var through2 = require('through2');
var images = require(path.normalize(__dirname + '/images'));
var Magic = mmm.Magic;
var config;
const ivLength = 16; // aes encryption

local.init = function(opts) {
  opts = opts || {};
  config = opts.config;
};

local.uploadPolicy = function(filename) {
  var imageName = images.generateUploadFilename(filename);
  var imageUrl = generateImageUrl(imageName);

  // create policy expiration
  var expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + 5);
  expiration = expiration.getTime();

  // build a polcy for local
  var policy = { filename: imageName, expiration: expiration };
  policy = JSON.stringify(policy);

  // hash policy
  let iv = crypto.randomBytes(ivLength);
  let keyHash = crypto.createHash('md5').update(config.privateKey, 'utf-8').digest('hex').toUpperCase();
  let cipher = crypto.createCipheriv('aes-256-ctr', keyHash, iv);
  var policyHash = cipher.update(policy,'utf8','hex');
  policyHash += cipher.final('hex');

  // add this imageUrl to the image expiration
  images.setExpiration(config.images.expiration, imageUrl);

  return {
    uploadUrl: '/api/images/upload',
    policy: iv.toString('hex') + ':' + policyHash.toString('hex'),
    storageType: 'local',
    imageUrl: imageUrl
  };
};

local.saveImage = function(imgSrc) {
  // image uploaded by client
  var url = imgSrc;
  if (imgSrc.indexOf(config.publicUrl) === 0 || imgSrc.indexOf(config.images.local.path) === 0) {
    // clear any expirations
    images.clearExpiration(imgSrc);
  }
  // hotlink image
  else {
    var filename = images.generateHotlinkFilename(imgSrc);
    local.uploadImage(imgSrc, filename);
    url = generateImageUrl(filename);
  }

  return url;
};

var generateImageUrl = function(filename) {
  var imageUrl = config.images.local.path + filename;
  return imageUrl;
};

local.uploadImage = function(source, filename, h) {
  var pathToFile = path.normalize(__dirname + '/../../../public/images');
  pathToFile = pathToFile + '/' + filename;
  var exists = fs.existsSync(pathToFile);  // check if file already exists

  if (exists) {
    if (h) { return h.response().code(204); }
  }
  else {
    return new Promise(function(resolve, reject) {
      // grab image
      var puller, error;
      if (h) { puller = source; }
      else { puller = request(source); }
      puller.on('error', function(err) {
        deleteImage(err, pathToFile);
        if (h) { return reject(Boom.badRequest('Could not process image')); }
      });
      puller.on('end', function () {
        if (h) {
          if (error) { return reject(Boom.badImplementation(error)); }
          else { return resolve(h.response().code(204)); }
        }
      });

      // check file type
      var newStream = true;
      var fileTypeCheck = new Magic(mmm.MAGIC_MIME_TYPE);
      var ftc = through2(function(chunk, enc, cb) {
        fileTypeCheck.detect(chunk, function(err, result) {
          var error;
          if (err) { error = err; }

          // check results
          if (result && newStream) {
            newStream = false;
            if (result.indexOf('image') !== 0) {
              error = new Error('Invalid File Type');
            }
          }

          // next
          return cb(error, chunk);
        });
      });
      ftc.on('error', function(err) {
        deleteImage(err, pathToFile);
        if (h) { error = Boom.unsupportedMediaType('File is not an image'); }
      });

      // check file size
      var size = 0;
      var sc = through2(function(chunk, enc, cb) {
        var error;
        size += chunk.length;
        if (size > config.images.maxSize) {
          error = new Error('Exceeded File Size');
        }
        return cb(error, chunk);
      });
      sc.on('error', function(err) {
        deleteImage(err, pathToFile);
        if (h) { error = Boom.badRequest('Image Size Limit Exceeded'); }
      });

      // write to disk
      var writer = fs.createWriteStream(pathToFile);
      writer.on('error', function (err) {
        deleteImage(err, pathToFile);
        if (h) { error = Boom.badImplementation(); }
      });

      puller.pipe(ftc).pipe(sc).pipe(writer);
    });
  }
};

var deleteImage = function(err, pathToFile) {
  if (err) { console.log(err); }
  fs.unlink(pathToFile, function(error) {
    if (error && error.code === 'ENOENT') { /* ignore deleted files */ }
    else if (error) { console.log(error); }
  });
};

local.removeImage = function(imageUrl) {
  var pathArray = imageUrl.split('/');
  var filepath = path.normalize(__dirname + '/../../../public/images');
  filepath = filepath + '/' + pathArray[pathArray.length-1];
  deleteImage(undefined, filepath);
};
