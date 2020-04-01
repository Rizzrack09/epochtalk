module.exports = ['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
  // Checks if user is an admin
  var adminCheck = function(route) {
    return ['$q', 'Session', function($q, Session) {
      if (!Session.isAuthenticated()) {
        return $q.reject({ status: 401, statusText: 'Unauthorized' });
      }
      if (route && Session.hasPermission('adminAccess' + '.' + route)) { return true; }
      else if (!route && Session.hasPermission('adminAccess')) { return true; }
      else { return $q.reject({ status: 403, statusText: 'Forbidden' }); }
    }];
  };

  var adminSettingsRedirect = ['$state', 'Session', function($state, Session) {
    if (Session.hasPermission('adminAccess.settings.general')) {
      $state.go('admin-settings.general', {}, {location: 'replace'});
    }
    else if (Session.hasPermission('adminAccess.settings.advanced')) {
      $state.go('admin-settings.advanced', {}, {location: 'replace'});
    }
    else if (Session.hasPermission('adminAccess.settings.legal')) {
      $state.go('admin-settings.legal', {}, { location: 'replace'});
    }
    else if (Session.hasPermission('adminAccess.settings.theme')) {
      $state.go('admin-settings.theme', {}, {location: 'replace'});
    }
    else { $state.go('home', {}, {location: 'replace'}); }
  }];

  $urlRouterProvider.when('/admin/settings', adminSettingsRedirect);
  $urlRouterProvider.when('/admin/settings/', adminSettingsRedirect);

  $stateProvider.state('admin-settings', {
    url: '/admin/settings',
    parent: 'admin-layout',
    views: {
      'content': {
        controller: ['$scope', 'Session', 'ThemeSVC', function($scope, Session, ThemeSVC) {
          var ctrl = this;
          this.hasPermission = Session.hasPermission;
          this.tab = null;
          this.previewActive = ThemeSVC.previewActive();
          $scope.$watch(function() { return ThemeSVC.previewActive(); }, function(val) { ctrl.previewActive = val; });
          if (Session.hasPermission('adminAccess.settings.general')) { this.tab = 'general'; }
          else if (Session.hasPermission('adminAccess.settings.advanced')) { this.tab = 'advanced'; }
          else if (Session.hasPermission('adminAccess.settings.legal')) { this.tab = 'legal'; }
          else if (Session.hasPermission('adminAccess.settings.theme')) { this.tab = 'theme'; }
          $scope.child = {};
        }],
        controllerAs: 'AdminSettingsCtrl',
        templateUrl: '/static/templates/admin/settings/index.html'
      }
    },
    resolve: { userAccess: adminCheck() }
  })
  .state('admin-settings.general', {
    url: '/general',
    views: {
      'data@admin-settings': {
        controller: 'GeneralSettingsCtrl',
        controllerAs: 'AdminSettingsCtrl',
        templateUrl: '/static/templates/admin/settings/general.html'
      }
    },
    resolve: {
      userAccess: adminCheck('settings.general'),
      $title: function() { return 'General Settings'; },
      settings: ['Configurations', function(Configurations) {
        return Configurations.get().$promise
        .then(function(settings) {
          // Remove unsettable configs
          delete settings.db;
          delete settings.rootDir;
          return settings;
        });
      }],
      loadCtrl: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          require('./general.controller');
          $ocLazyLoad.load([
            { name: 'ept.admin.settings.general.ctrl' },
            { name: 'ept.directives.image-uploader' }
          ]);
          deferred.resolve();
        });
        return deferred.promise;
      }],
    }
  })
  .state('admin-settings.advanced', {
    url: '/advanced',
    views: {
      'data@admin-settings': {
        controller: 'AdvancedSettingsCtrl',
        controllerAs: 'AdminSettingsCtrl',
        templateUrl: '/static/templates/admin/settings/advanced.html'
      }
    },
    resolve: {
      userAccess: adminCheck('settings.advanced'),
      $title: function() { return 'Advanced Settings'; },
      settings: ['Configurations', function(Configurations) {
        return Configurations.get().$promise
        .then(function(settings) {
          // Remove unsettable configs
          delete settings.db;
          delete settings.rootDir;
          return settings;
        });
      }],
      loadCtrl: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          require('./advanced.controller');
          $ocLazyLoad.load([
            { name: 'ept.admin.settings.advanced.ctrl' }
          ]);
          deferred.resolve();
        });
        return deferred.promise;
      }],
    }
  })
  .state('admin-settings.legal', {
    url: '/legal',
    views: {
      'data@admin-settings': {
        controller: 'LegalSettingsCtrl',
        controllerAs: 'AdminSettingsCtrl',
        templateUrl: '/static/templates/admin/settings/legal.html'
      }
    },
    resolve: {
      userAccess: adminCheck('settings.legal'),
      $title: function() { return 'Legal Settings'; },
      text: ['Legal', function(Legal) {
        return Legal.text().$promise
        .then(function(text) { return text; });
      }],
      loadCtrl: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          require('./legal.controller');
          $ocLazyLoad.load([ { name: 'ept.admin.settings.legal.ctrl' } ]);
          deferred.resolve();
        });
        return deferred.promise;
      }],
    }
  })
  .state('admin-settings.theme', {
    url: '/theme?preview',
    views: {
      'data@admin-settings': {
        controller: 'ThemeSettingsCtrl',
        controllerAs: 'AdminSettingsCtrl',
        templateUrl: '/static/templates/admin/settings/theme.html'
      }
    },
    resolve: {
      userAccess: adminCheck('settings.theme'),
      $title: function() { return 'Theme Settings'; },
      theme: ['Themes', '$stateParams', function(Themes, $stateParams) {
        var preview = $stateParams.preview;
        var params;
        if (preview) { params = { preview: preview }; }
        return Themes.getTheme(params).$promise
        .then(function(theme) {
          return theme;
        });
      }],
      settings: ['Configurations', function(Configurations) {
        return Configurations.get().$promise
        .then(function(settings) {
          // Remove unsettable configs
          delete settings.db;
          delete settings.rootDir;
          return settings;
        });
      }],
      loadCtrl: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          require('./theme.controller');
          $ocLazyLoad.load([
            { name: 'ept.admin.settings.theme.ctrl' },
            { name: 'ept.directives.color-validator' }
          ]);
          deferred.resolve();
        });
        return deferred.promise;
      }],
    }
  });
}];
