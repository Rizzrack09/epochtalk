var path = require('path');
var dbc = require(path.normalize(__dirname + '/../db'));
var db = dbc.db;

module.exports = function() {
  var q = `UPDATE factoids SET enabled = true RETURNING enabled;`;
  return db.scalar(q);
};
