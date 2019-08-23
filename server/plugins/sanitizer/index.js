var sanitize = require('sanitize-html');

var sanitizer = {};

module.exports = {
  name: 'sanitizer',
  version: '1.0.0',
  register: async function(server, options) {
    options = options || {};

    server.decorate('server', 'sanitizer', sanitizer);
    server.decorate('request', 'sanitizer', sanitizer);
  }
};

sanitizer.strip = function(input) {
  // remove all html
  // used for titles, names, and profile info
  return sanitize(input, { allowedTags: [] });
};

sanitizer.default = function(input) {
  // default sanitizer from sanitize-html
  /*
    allowedTags: [ 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre' ],

    allowedAttributes: {
      a: [ 'href', 'name', 'target' ],
      // We don't currently allow img itself by default, but this
      // would make sense if we did
      img: [ 'src' ]
    },

    // Lots of these won't come up by default because we don't allow them
    selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],

    // URL schemes we permit
    allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ]
  */
  return sanitize(input);
};

sanitizer.display = function(input) {
  // used for descriptions and other formatted text (with links)
  return sanitize(input, {
    allowedTags: [ 'blockquote', 'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre' ],
    allowedAttributes: {
      a: [ 'href', 'name', 'target' ],
    },
    // Lots of these won't come up by default because we don't allow them
    selfClosing: [ 'br', 'hr' ],
    // URL schemes we permit
    allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ]
  });
};

sanitizer.bbcode = function(input) {
  // used for posts and user signatures
  // display tags plus font, font face, font size
  var regex = /\[code\]([\s\S]*?)\[\/code\]/gi;
  var codeTags = input.match(regex);
  var replacedTagsInput = input;

  var codeMatches = input.match(regex);
  if (codeMatches && codeMatches.length) {
    codeMatches.forEach(function(val) {
      replacedTagsInput = replacedTagsInput.replace(val, '[code][/code]');
    });
  }

  var text = sanitize(replacedTagsInput, {
    allowedTags: false, // allow all tags thru, angular will sanitize
    allowedAttributes: {
      a: [ 'href', 'name', 'target' ],
      img: [ 'src', 'srcset', 'alt' ],
    },
    // Lots of these won't come up by default because we don't allow them
    selfClosing: [ 'img', 'br', 'hr', 'area' ],
    // URL schemes we permit
    allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ]
  });

  var cleanedText = text;
  var i = 0;
  var matches = text.match(regex);
  if (matches && matches.length) {
    matches.forEach(function(val) {
      cleanedText = cleanedText.replace(val, codeTags[i++]);
    });
  }

  return cleanedText;
};
