var path = require('path');
var db = require(path.normalize(__dirname + '/db'));
var routes = require(path.normalize(__dirname + '/routes'));

module.exports =  {
  name: 'patroller',
  routes: routes,
  db: db
};
