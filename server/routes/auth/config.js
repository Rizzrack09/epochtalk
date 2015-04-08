var Joi = require('joi');
var path = require('path');
var Hapi = require('hapi');
var Boom = require('boom');
var crypto = require('crypto');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var Promise = require('bluebird');
var db = require(path.normalize(__dirname + '/../../../db'));
var emailer = require(path.normalize(__dirname + '/../../emailer'));
var config = require(path.normalize(__dirname + '/../../../config'));
var memDb = require(path.normalize(__dirname + '/../../memstore')).db;
var pre = require(path.normalize(__dirname + '/pre'));

var buildToken = function(user) {
  // create token
  var decodedToken = {
    id: user.id,
    username: user.username,
    email: user.email
    // token expiration
  };
  // build jwt token from decodedToken and privateKey
  return jwt.sign(decodedToken, config.privateKey);
};

exports.login = {
  auth: { mode: 'try', strategy: 'jwt' },
  validate: {
    payload: {
      username: Joi.string().min(1).max(255).required(),
      password: Joi.string().min(8).max(72).required()
    }
  },
  handler: function(request, reply) {
    // check if already logged in with jwt
    if (request.auth.isAuthenticated) {
      var loggedInUser = request.auth.credentials;
      var loginReply = {
        token: loggedInUser.token,
        username: loggedInUser.username,
        userId: loggedInUser.id
      };
      return reply(loginReply);
    }

    var username = request.payload.username;
    var password = request.payload.password;
    return db.users.userByUsername(username)
    .then(function(user) { // check user exists
      if (user) { return user; }
      else { return Promise.reject(Boom.badRequest('Invalid Credentials')); }
    })
    .then(function(user) { // check confirmation token
      if (user.confirmation_token) {
        return Promise.reject(Boom.badRequest('Account Not Confirmed'));
      }
      else { return user; }
    })
    .then(function(user) { // check if passhash matches
      if (bcrypt.compareSync(password, user.passhash)) { return user; }
      else { return Promise.reject(Boom.badRequest('Invalid Credentials')); }
    })
    .then(function(user) { // build and save token
      var token = buildToken(user);
      memDb.put(user.id, token, function(err) {
        if (err) { throw new Error(err); }
        var userReply = {
          token: token,
          username: user.username,
          userId: user.id
        };
        return reply(userReply);
      });
    })
    .catch(function(err) {
      if (err.isBoom) { return reply(err); }
      else return reply(Boom.badImplementation(err));
    });
  }
};

exports.logout = {
  auth: { mode: 'try', strategy: 'jwt' },
  handler: function(request, reply) {
    // check if already logged in with jwt
    if (!request.auth.isAuthenticated) {
      return reply(Boom.badRequest('Not Logged In'));
    }

    // delete jwt from memdown
    memDb.del(request.auth.credentials.id, function(err) {
      if (err) { return reply(Boom.badImplementation(err)); }
      else { return reply(true); }
    });
  }
};

exports.register = {
  auth: { mode: 'try', strategy: 'jwt' },
  validate: {
    payload: {
      username: Joi.string().min(1).max(255).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).max(72).required(),
      confirmation: Joi.ref('password')
    }
  },
  pre: [
    [
      { method: pre.checkUniqueEmail },
      { method: pre.checkUniqueUsername }
    ]
  ],
  handler: function(request, reply) {
    // check if already logged in with jwt
    if (request.auth.isAuthenticated) {
      var loggedInUser = request.auth.credentials;
      var loginReply = {
        token: loggedInUser.token,
        username: loggedInUser.username,
        userId: loggedInUser.id
      };
      return reply(loginReply);
    }

    var newUser = {
      username: request.payload.username,
      email: request.payload.email,
      password: request.payload.password,
      confirmation_token: crypto.randomBytes(20).toString('hex')
    };
    // check that username or email does not already exist
    return db.users.create(newUser)
    .then(function(user) { // send confirmation email
      var confirmUrl = config.publicUrl + '/' + path.join('confirm', user.username, user.confirmation_token);
      reply({ statusCode: 200, message: 'Successfully Created Account',
        username: user.username,
        confirm_token: user.confirmation_token,
        confirm_url: confirmUrl
      });
      var emailParams = {
        email: user.email, username: user.username, confirm_url: confirmUrl
      };
      request.server.log('debug', emailParams);
      emailer.send('confirmAccount', emailParams);
    })
    .catch(function(err) {
      return reply(Boom.badImplementation(err));
    });
  }
};

exports.confirmAccount = {
  validate: {
    payload: {
      username: Joi.string().min(1).max(255).required(),
      token: Joi.string().required()
    }
  },
  handler: function(request, reply) {
    var username = request.payload.username;
    var confirmationToken = request.payload.token;
    db.users.userByUsername(username)
    .then(function(user) {
      if (user) { return user; }
      else { return Promise.reject(Boom.badRequest('Account Not Found')); }
    })
    .then(function(user) {
      var tokenMatch = confirmationToken === user.confirmationToken;
      if (user.confirmation_token && tokenMatch) {
        return db.users.update({ confirmation_token: null, id: user.id });
      }
      else {
        return Promise.reject(Boom.badRequest('Account Confirmation Error'));
      }
    })
    .then(function(updatedUser) {
      var authToken = buildToken(updatedUser);
      memDb.put(updatedUser.id, authToken, function(err) {
        if (err) { throw new Error(err); }
        var userReply = {
          token: authToken,
          username: updatedUser.username,
          userId: updatedUser.id
        };
        reply(userReply);
      });
    })
    .catch(function(err) {
      if (err.isBoom) { return reply(err); }
      else { return reply(Boom.badImplementation(err)); }
    });
  }
};

exports.isAuthenticated = {
  auth: { mode: 'try', strategy: 'jwt' },
  handler: function(request, reply) {
    // check if already logged in with jwt
    if (request.auth.isAuthenticated) {
      return reply({ authenticated: true });
    }
    else {
      reply({ authenticated: false }).header('Authorization', 'Revoked');
    }
  }
};

exports.username = {
  validate: { params: { username: Joi.string().min(1).max(255).required() } },
  handler: function(request, reply) {
    var username = request.params.username;
    db.users.userByUsername(username)
    .then(function(user) {
      var found = !!user;
      reply({ found: found });
    })
    .catch(function() { reply({ found: false }); });
  }
};

exports.email = {
  validate: { params: { email: Joi.string().email().required() } },
  handler: function(request, reply) {
    var email = request.params.email;
    db.users.userByEmail(email)
    .then(function(user) {
      var found = !!user;
      reply({ found: found });
    })
    .catch(function() { reply({ found: false }); });
  }
};

exports.recoverAccount = {
  validate: { params: { query: Joi.string().min(1).max(255).required(), } },
  handler: function(request, reply) {
    var query = request.params.query;
    db.users.userByUsername(query)
    .then(function(user) {
      if (user) { return user; }
      else { return Promise.reject(Boom.badRequest('No Account Found')); }
    })
    .catch(function() { return db.users.userByEmail(query); })
    .then(function(user) {
      if (user) { return user; }
      else { return Promise.reject(Boom.badRequest('No Account Found')); }
    })
    .then(function(user) {
      // Build updated user with resetToken and resetExpiration
      var updateUser = {};
      updateUser.reset_token = crypto.randomBytes(20).toString('hex');
      updateUser.reset_expiration = Date.now() + 1000 * 60 * 60; // 1 hr
      updateUser.id = user.id;
      // Store token and expiration to user object
      return db.users.update(updateUser);
    })
    .then(function(user) {
      // Email user reset information here
      var emailParams = {
        email: user.email,
        username: user.username,
        reset_url: config.publicUrl + '/' + path.join('reset', user.username, user.reset_token)
      };
      return emailer.send('recoverAccount', emailParams);
    })
    .then(function(success) { reply(success); })
    .catch(function(err) {
      if (err.isBoom) { return reply(err); }
      else { return reply(Boom.badImplementation(err)); }
    });
  }
};

exports.resetPassword = {
  validate: {
    payload: {
      username: Joi.string().min(1).max(255).required(),
      password: Joi.string().min(8).max(72).required(),
      confirmation: Joi.ref('password'),
      token: Joi.string().token().required()
    }
  },
  handler: function(request, reply) {
    var username = request.payload.username;
    var password = request.payload.password;
    var token = request.payload.token;
    db.users.userByUsername(username)
    .then(function(user) {
      if (user) { return user; }
      else { return Promise.reject(Boom.badRequest('Account Not Found')); }
    })
    .then(function(user) {
      var now = Date.now();
      var tokenMatched = user.reset_token && user.reset_token === token;
      var expiryValid = user.reset_expiration && now < user.reset_expiration;
      if (tokenMatched && expiryValid) {
        var updateUser = {};
        updateUser.id = user.id;
        updateUser.reset_expiration = null;
        updateUser.reset_token = null;
        updateUser.password = password;
        return updateUser;
      }
      else { return Promise.reject(Boom.badRequest('Invalid reset token.')); }
    })
    .then(db.users.update)
    .then(function(updatedUser) {
      // TODO: Send password reset confirmation email here
      return reply('Password Successfully Reset');
    })
    .catch(function(err) {
      if (err.isBoom) { return reply(err); }
      else { return reply(Boom.badImplementation(err)); }
    });
  }
};

exports.checkResetToken = {
  validate: {
    params: {
      username: Joi.string().min(1).max(255).required(),
      token: Joi.string().required()
    }
  },
  handler: function(request, reply) {
    var username = request.params.username;
    var token = request.params.token;
    db.users.userByUsername(username)
    .then(function(user) {
      if (!user) { return reply(Boom.badRequest('No Account Found.')); }
      var now = Date.now();
      var tokenValid = user.reset_token && user.reset_token === token;
      var tokenExpired =  user.reset_expiration && now > user.reset_expiration;
      var ret = {
        token_valid: tokenValid,
        token_expired: tokenValid ? tokenExpired : undefined
      };
      return reply(ret);
    })
    .catch(function() { return reply({ token_valid: false }); });
  }
};

exports.refreshToken = {
  handler: function(request, reply) { return reply(true); }
};
