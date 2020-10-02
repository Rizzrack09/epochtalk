var service = ['User', 'Session', 'PreferencesSvc', 'BanSvc', '$rootScope', 'Alert', '$state', '$stateParams',
  function(User, Session, PreferencesSvc, BanSvc, $rootScope, Alert, $state, $stateParams) {
    var toggleLogin = false;
    var toggleRegister = false;
    // Service API
    var serviceAPI = {
      register: function(user) {
        return User.register(user).$promise
        .then(function(resource) {
          // Set user session if account is already confirmed (log the user in)
          if (!resource.confirm_token) {
            Session.setUser(resource);
            $rootScope.$emit('loginEvent');
          }
          return resource;
        })
        .catch(console.log);
      },
      login: function(user) {
        return User.login(user).$promise
        .then(function(resource) { Session.setUser(resource); })
        .then(function() { PreferencesSvc.pullPreferences(); })
        .then(function() { $rootScope.$emit('loginEvent'); });
      },
      logout: function() {
        return User.logout().$promise
        .then(function() { Session.clearUser(); })
        .then(function() { PreferencesSvc.clearPreferences(); })
        .then(function() { $state.go($state.current, $stateParams, { reload: true }); })
        .finally(function() { $rootScope.$emit('logoffEvent'); });
      },
      toggleLogin: function(open) {
        toggleLogin = open;
        return toggleLogin;
      },
      triggerLoginModal: function() {
        return toggleLogin;
      },
      toggleRegister: function(open) {
        toggleRegister = open;
        return toggleRegister;
      },
      triggerRegisterModal: function() {
        return toggleRegister;
      },
      authenticate: function() {
        if (Session.getToken()) {
          User.ping().$promise
          .then(function(user) {
            Session.setUser(user);
            PreferencesSvc.pullPreferences();
            BanSvc.update();
          })
          .catch(function(err) {
            Alert.warning('Session no longer valid, you have been logged out.');
            console.log(err);
          });
        }
        else { Session.clearUser(); }
      }
    };

    serviceAPI.authenticate();
    return serviceAPI;
  }
];

angular.module('ept').service('Auth', service);
