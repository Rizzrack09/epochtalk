var directive = ['$timeout', '$filter', '$compile', function($timeout, $filter, $compile) {
  return {
    scope: {
      postProcessing: '=',
      styleFix: '=',
      isNewbie: '='
    },
    restrict: 'A',
    link: function($scope, $element) {
      // Auto Date Regex
      var autoDateRegex = /(ept-date=[0-9]+)/ig;
      var autoDate = function(timeString) {
        timeString = timeString.replace('ept-date=', '');
        var dateNumber = Number(timeString) || 0;
        var date = new Date(dateNumber);

        var now = new Date();
        var isToday = now.toDateString() === date.toDateString();
        var isThisYear = now.getYear() === date.getYear();
        if (isToday) {
          date = 'Today at ' +  $filter('date')(date, 'h:mm:ss a');
        }
        else if (isThisYear) {
          date = $filter('date')(date, 'MMMM d, h:mm:ss a');
        }
        else {
          date = $filter('date')(date, 'MMM d, y, h:mm:ss a');
        }
        return date;
      };

      // Auto Link Regex
      var autoLinkRegex = /(?!<code[^>]*?>)((?:https?\:\/\/)+(?![^\s]*?")([\w.,@?^=%&amp;:\/~\(\)+#-]*[\w@?^=%&amp;\/~\(\)+%#-])?)(?![^<]*?<\/code>)/ig;
      var autoLink = function(url) {
        var wrap = document.createElement('div');
        var anch = document.createElement('a');

        if (validUrl(url)) {
          anch.innerHTML = url;
          anch.href = url;
          anch.target = '_blank';
          wrap.appendChild(anch);
          return wrap.innerHTML;
        }
        else { return url; }
      };

      var validUrl = function(s) {
        try {
          var testUrl = new URL(s);
          var urlRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,%;=.]+$/gm;
          var reg = new RegExp(urlRegex);
          return s.match(reg);
        }
        catch(e) { return false; }
      };

      // Auto video embed Regex
      var autoVideoRegex = /(?!<code[^>]*?>)((?:.+?)?(?:\/v\/|watch\/|\?v=|\&v=|youtu\.be\/|\/v=|^youtu\.be\/|\/youtu.be\/)([a-zA-Z0-9_-]{11})+(?:[a-zA-Z0-9;:@#?&%=+\/\$_.-]*)*(?:(t=(?:(\d+h)?(\d+m)?(\d+s)?)))*)(?![^<]*?<\/code>)/gi;
      var autoVideo = function(urlString) {

        if (validUrl(urlString)) {
          // Convert url string to URL Object
          // This allows us to specifically check things like the host or query params
          // as opposed to doing a regex on a url string
          var url = new URL(urlString);

          // create query params dict
          var queryParams = {};
          var query = url.search.substring(1);
          var vars = query.split('&');
          for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            queryParams[pair[0]] = pair[1];
          }

         // parse url for youtube video id if present in query param
         var videoId;
         // check for shortened youtu.be
         // if found parse out video id from pathname
         if (url.host.indexOf('youtu.be') > -1) {
           videoId = url.pathname.replace('/', '');
         }
         // otherwise look for video id in the query parameters
         else { videoId = queryParams.v; }

         // If video id isn't present at this point return original string
         if (videoId) {
            // time search param
            var time = queryParams.t;
            if (time && time.indexOf('s') === time.length - 1) {
              time = time.slice(0, -1);
            }
            var src = 'https://www.youtube.com/embed/' + videoId;
            if (time) { src += '?start=' + time; }

            // create youtube iframe`
            var wrap = document.createElement('div');
            var vidWrap = document.createElement('div');
            vidWrap.className = 'video-wrap';
            var frame = document.createElement('iframe');
            frame.width = 640;
            frame.height = 360;
            frame.src = src;
            frame.setAttribute('frameborder', 0);
            frame.setAttribute('allowfullscreen', '');
            vidWrap.appendChild(frame);
            wrap.appendChild(vidWrap);

            // return content
            return wrap.innerHTML;
          }
          else {return urlString; }
        }
        else { return urlString; }
      };

      // Style Fix Regex
      var styleFixRegex = /(class="bbcode-\S*")/ig;
      var styleFix = function(styleString) {
        // remove bbcode-prefix
        var classString = styleString.replace('class="bbcode-', '');
        classString = classString.replace('"', '');

        if (classString.indexOf('color-_') === 0) {
            var colorCode = classString.replace('color-_', '');
            return 'ng-style="{ \'color\': \'#' + colorCode + '\' }"';
        }
        else if (classString.indexOf('color') === 0) {
          var color = classString.replace('color-', '');
          return 'ng-style="{ \'color\': \'' + color + '\' }"';
        }
        else if (classString.indexOf('bgcolor-_') === 0) {
          var bgColorCode = classString.replace('bgcolor-_', '');
          return 'ng-style="{ \'background-color\': \'#' + bgColorCode + '\' }"';
        }
        else if (classString.indexOf('bgcolor') === 0) {
          var bgColor = classString.replace('bgcolor-', '');
          return 'ng-style="{ \'background-color\': \'' + bgColor + '\' }"';
        }
        else if (classString.indexOf('text') === 0) {
          var dir = classString.replace('text-', '');
          return 'ng-style="{ \'text-align\': \'' + dir + '\' }"';
        }
        else if (classString.indexOf('list') === 0) {
          var type = classString.replace('list-', '');
          return 'ng-style="{ \'list-style-type\': \'' + type + '\' }"';
        }
        else if (classString.indexOf('shadow-_') === 0) {
          var shadowCode = classString.replace('shadow-_', '');
          shadowCode = shadowCode.replace(/_/gi, ' ');
          shadowCode = '#' + shadowCode;
          return 'ng-style="{ \'text-shadow\': \'' + shadowCode + '\' }"';
        }
        else if (classString.indexOf('shadow') === 0) {
          var shadow = classString.replace('shadow-', '');
          shadow = shadow.replace(/_/gi, ' ');
          return 'ng-style="{ \'text-shadow\': \'' + shadow + '\' }"';
        }
        else if (classString.indexOf('size') === 0) {
          var size = classString.replace('size-', '');
          return 'ng-style="{ \'font-size\': \'' + size + '\' }"';
        }
        else {
          return styleString;
        }
      };

      var uuidv4 = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      var process = function() {
        var postBody = $scope.postProcessing;
        var processed = postBody || '';
        var doStyleFix = $scope.styleFix;
        // autoDate and autoLink
        processed = processed.replace(new RegExp('&#47;&#47;', 'g'), '//');
        processed = processed.replace(autoDateRegex, autoDate) || processed;

        if (!$scope.isNewbie) {
          processed = processed.replace(autoVideoRegex, autoVideo) || processed;
          processed = processed.replace(autoLinkRegex, autoLink) || processed;
        }

        // styleFix
        if (doStyleFix) {
          processed = processed.replace(styleFixRegex, styleFix) || processed;
        }

        // dump html into element
        $element.html(processed);

        // Remove first newline from codeblock
        // This allows users to type:
        // [code]
        // Hello World
        // [/code]
        // Without having extra padding at the top of the code block
        var codeBlocks = $element.find('CODE');
        if (codeBlocks.length > 0) {
          for (var i = 0; i < codeBlocks.length; i++) {
            var codeBlock = angular.element(codeBlocks[i]);
            var text = codeBlock.text();
            if (text && text.charAt(0) === '\r') {
              text = text.substr(1);
              codeBlock.text(text);
            }
          }
        }

        // Remove extra newlines following quoteblocks
        var quoteBlocks = $element.find('.quote');
        if (quoteBlocks.length > 0) {
          for (var i = 0; i < quoteBlocks.length; i++) {
            var quoteBlock = angular.element(quoteBlocks[i])[0].nextSibling;
            var text = quoteBlock ? quoteBlock.nodeValue : '';
            if (text && text.charAt(0) === '\r') {
              quoteBlock.nodeValue = text.substr(2);
            }
          }
        }

        // Surround non images in non-bindable to prevent injection
        var nonBindableHTML = '<span ng-non-bindable>' + $element.html() + '</span>';

        // Quotes are a special case we need to handle because they can be nested.
        // This closes the non-bindable span outside the quote, and opens a new one
        // wrapping the contents inside the quote body
        var quotes = $element.find('.quote');
        quotes.each(function(index, quote) {
          var outterHTML = $(quote)[0].outerHTML;
          var innerHTML = $(quote).html();
          var nonBindable = '<span ng-non-bindable>' + innerHTML + '</span>';
          var newOutter = '</span>' +  outterHTML.replace(innerHTML, nonBindable) + '<span ng-non-bindable>';
          nonBindableHTML = nonBindableHTML.replace(outterHTML, newOutter);
        });

        // This closes the non-bindable span outside the quoteHeader, and opens a new one
        // wrapping the contents inside the quote header
        var quoteHeaders = $element.find('.quoteHeader');
        quoteHeaders.each(function(index, qh) {
          var outterHTML = $(qh)[0].outerHTML;
          var innerHTML = $(qh).html();
          var nonBindable = '<span ng-non-bindable>' + innerHTML + '</span>';
          var newOutter = '</span>' +  outterHTML.replace(innerHTML, nonBindable) + '<span ng-non-bindable>';
          nonBindableHTML = nonBindableHTML.replace(outterHTML, newOutter);
        });

        // image loading
        var imageCache = {};
        var images = $element.find('img');
        images.each(function(index, image) {
          var isTopLevel = true;
          $(image).parents().each(function(index, parent) {
            // image is not top level dont use image loader
            if (index > 0 && $(parent)[0].classList.contains('post-body')) {
              isTopLevel = false;
            }
          });
          var uuid = uuidv4();
          var preservedOutterHTML = $(image)[0].outerHTML;
          if (isTopLevel) {
            image = $(image).addClass('image-loader'); // attach directive\
            imageCache[uuid] = $(image)[0].outerHTML;
            nonBindableHTML = nonBindableHTML.replace(preservedOutterHTML, uuid);
          }
          else { // bypass image loader if image isn't top level
            image = $(image).addClass('image-loader loaded'); // attach directive
            nonBindableHTML = nonBindableHTML.replace(preservedOutterHTML, $(image)[0].outerHTML);
          }
        });

        // Remove all images from non-bindable spans
        Object.keys(imageCache).forEach(function(uuid) {
          var replaceWith = '</span>' + imageCache[uuid] + '<span ng-non-bindable>';
          nonBindableHTML = nonBindableHTML.replace(uuid, replaceWith)
        });

        // Replace mentions which use ui-sref, allow directive to bind
        var ngLinks = $element.find('[ui-sref]');
        ngLinks.each(function(index, link) {
          var linkHTML = $(link)[0].outerHTML;
          var username = $(link)[0].attributes[0].textContent.split('\'')[1];
          var replaceWith = '<a href="/profiles/' + username + '">@' + username + '</a>';
          nonBindableHTML = nonBindableHTML.replace(linkHTML, replaceWith);
        });

        // Rebind html to $element after excluding images from ng-non-bindable
        $element.html(nonBindableHTML);

        // noopener/noreferrer hack
        $('a[target="_blank"]').attr('rel', 'noopener noreferrer');

        // compile directives
        $compile($element.contents())($scope);
      };

      $scope.$watch('postProcessing',
        function() { $timeout(function () { process(); }); }
      );
    }
  };
}];

angular.module('ept').directive('postProcessing', directive);
