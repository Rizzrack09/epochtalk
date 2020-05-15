var directive = ['Mentions', '$timeout', 'Alert',
  function(Mentions, $timeout, Alert) {
  return {
    restrict: 'E',
    scope: true,
    template: require('./mentions-ignore.settings.directive.html'),
    controllerAs: 'vmIgnoreUserMentions',
    controller: [function() {
      // page variables
      var ctrl = this;
      this.emailsDisabled;
      this.showRemoveModal;
      this.userToIgnore = {};
      this.page = 1;

      this.init = function() {
        var query = { limit: 10 };
        return Mentions.pageIgnoredUsers(query).$promise
        .then(function(ignored) {
          // index variables
          ctrl.page = ignored.page;
          ctrl.limit = ignored.limit;
          ctrl.users = ignored.data;
          ctrl.next = ignored.next;
          ctrl.prev = ignored.prev;
          return Mentions.getMentionEmailSettings().$promise
        })
        .then(function(data) {  ctrl.emailsDisabled = data.email_mentions; })
        .catch(function(err) { Alert.error('There was an error paging ignored users.'); });
      };

      $timeout(function() { ctrl.init(); })

      // page actions

      this.unignore = function(user) {
        return Mentions.unignoreUser({ username: user.username }).$promise
        .then(function() {
          Alert.success('Successfully uningored ' + user.username);
          $timeout(function() { user.ignored = false; });
        });
      };

      this.ignore = function(user) {
        return Mentions.ignoreUser({username: user.username}).$promise
        .then(function(res) {
          Alert.success('Successfully ingored ' + user.username);
          $timeout(function() { user.ignored = true; });
          return res;
        });
      };

      this.ignoreUser = function(username) {
        return Mentions.ignoreUser({username: username}).$promise
        .then(function(res) {
          Alert.success('Successfully ingored ' + username);
          ctrl.pullPage(0);
          ctrl.userToIgnore = {};
          return res;
        });
      }

      // page controls
      this.pullPage = function(pageIncrement) {
        ctrl.page = ctrl.page + pageIncrement;
        var query = { page: ctrl.page, limit: ctrl.limit };

        // replace current threads with new threads
        return Mentions.pageIgnoredUsers(query).$promise
        .then(function(pageData) {
          ctrl.prev = pageData.prev;
          ctrl.next = pageData.next;
          ctrl.users = pageData.data;
        });
      };

      this.enableMentionEmails = function() {
        var payload = { enabled: !ctrl.emailsDisabled };
        return Mentions.enableMentionEmails(payload).$promise
        .then(function() {
          var action = ctrl.emailsDisabled ? 'Enabled' : 'Disabled';
          Alert.success('Successfully ' + action + ' Mention Emails');
        })
        .catch(function(e) {
          ctrl.emailsDisabled = !ctrl.emailsDisabled;
          Alert.error('There was an error updating your mention settings');
        });
      };

    }]
  };
}];


angular.module('ept').directive('ignoreMentionsSettings', directive);
