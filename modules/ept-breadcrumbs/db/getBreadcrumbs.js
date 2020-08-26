var path = require('path');
var dbc = require(path.normalize(__dirname + '/db'));
var db = dbc.db;
var helper = dbc.helper;

module.exports = function(objId, objType, request) {
  // method type enum
  var findType = {
    board: request.db.boards.breadcrumb,
    category: request.db.categories.find,
    thread: request.db.threads.breadcrumb,
    post: request.db.posts.find
  };

  // Type enum
  var type = {
    board: 'board',
    category: 'category',
    thread: 'thread'
  };

  // Recursively Build breadcrumbs
  var buildCrumbs = function(id, curType, crumbs) {
    if (!id) { return crumbs; }
    return findType[curType](id)
    .then(function(obj) {
      var nextType, nextId;
      if (curType === type.category) { // Category
        var catName = obj.name;
        var anchor = (obj.name + '-' + obj.view_order).replace(/\s+/g, '-').toLowerCase();
        crumbs.push({ label: catName, state: '^.boards', opts: { '#': anchor }});
      }
      else if (curType === type.board) { // Board
        if (!obj.parent_slug && obj.category_id) { // Has no Parent
          nextType = type.category;
          nextId = obj.category_id;
        }
        else { // Has Parent
          nextType = type.board;
          nextId = obj.parent_slug;
        }
        crumbs.push({ label: obj.name, state: 'threads.data', opts: { boardSlug: id } });
      }
      else if (curType === type.thread) { // Thread
        crumbs.push({ label: obj.title, state: 'posts.data', opts: { slug: id } });
        nextType = type.board;
        nextId = obj.board_slug;
      }
      if (curType === type.thread) {
        var q = 'SELECT locked FROM threads WHERE slug = $1';
        return db.scalar(q, [id])
        .then(function(post) {
          crumbs[0].opts.locked = post.locked;
          return buildCrumbs(nextId, nextType, crumbs);
        });
      }
      else {
        return buildCrumbs(nextId, nextType, crumbs);
      }
    });
  };

  // Build the breadcrumbs and reply
  return buildCrumbs(objId, objType, [])
  .then(function(breadcrumbs) { return breadcrumbs.reverse(); });
};
