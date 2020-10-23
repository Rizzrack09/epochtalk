var bbcodeCompiler = require('./bbcode');
var sanitizeHtml = require('./sanitize-html.min');
var bbcodeDumbCompiler = require('./bbcode-dumb');

module.exports = {
  parse: function (input, sanitize) {
    if (!input) { input = ''; }

    var regex = /(\[code\]([\s\S]*?)\[\/code\])|(```([\s\S]*?)```)/gi;
    var codeTags = input.match(regex);
    var replacedTagsInput = input;

    var codeMatches = input.match(regex);
    if (codeMatches && codeMatches.length) {
      codeMatches.forEach(function(val) {
        replacedTagsInput = replacedTagsInput.replace(val, '[code][/code]');
      });
    }

    var cleanedText = replacedTagsInput;
    if (sanitize) {
      // used for posts and user signatures
      // display tags plus font, font face, font size
      cleanedText = sanitizeHtml(replacedTagsInput, {
        allowedTags: [ 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'table', 'thead', 'tfoot', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'sub', 'sup', 'tt', 'del' ],
        allowedAttributes: {
          a: [ 'href', 'name', 'target' ],
          img: [ 'src', 'srcset', 'alt' ],
        },
        // Lots of these won't come up by default because we don't allow them
        selfClosing: [ 'img', 'br', 'hr', 'area' ],
        // URL schemes we permit
        allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ]
      });
    }

    var i = 0;
    var matches = cleanedText.match(regex);
    if (matches && matches.length) {
      matches.forEach(function(val) {
        var replacee = codeTags[i++];
        // Stop bbcode inside of markdown code tag from being proccessed
        if (replacee.indexOf('```') === 0 && replacee.lastIndexOf('```') === (replacee.length - 3)) {
          replacee = replacee.replace(/```/, '[code]');
          replacee = replacee.slice(0, -3) + '[/code]';
        }
        cleanedText = cleanedText.replace(val, replacee);
      });
    }

    input = cleanedText;

    // Stop html entities from being encoded by replacing & with entity
    input = input.replace(/(?:&)/g, '&#38;');
    // this basically prevents html tags
    // convert all (<, &lt;) and (>, &gt;) to decimal to escape the regex
    // in the bbcode dumbBBcodeParser that'll unescape those chars
    input = input.replace(/(?:<|&lt;)/g, '&#60;');
    input = input.replace(/(?:>|&gt;)/g, '&#62;');
    if (input.indexOf('[') >= 0) {
      // parse input to generate body
      input = bbcodeCompiler.process({text: input}).html;
      // If there are any ['s left we need to parse them
      if (input.indexOf('[') >= 0) {
        input = bbcodeDumbCompiler.process(input);
      }
    }

    // Convert back to lt and gt
    input = input.replace(/(?:&#60;)/g, '&lt;');
    input = input.replace(/(?:&#62;)/g, '&gt;');

    // replace entity for & after processing bbcode
    input = input.replace(/(?:&#38;)/g, '&');
    return input;
  }
};
