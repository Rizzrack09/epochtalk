var path = require('path');

module.exports = [
  {
    register: require(path.normalize(__dirname + '/notifications')),
    db: db,
    config: config
  }
];
