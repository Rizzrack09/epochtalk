var ctrl = ['$rootScope', '$location', 'PreferencesSvc', 'User', 'Alert', 'Session', 'boards', 'user',
  function($rootScope, $location, PreferencesSvc, User, Alert, Session, boards, user) {
    var ctrl = this;
    this.user = user;
    this.boards = boards;
    this.allBoards = {};
    this.toggleSubmitted = {};
    this.userPrefs = PreferencesSvc.preferences;
    if (this.userPrefs.timezone_offset) {
      this.timezone_offset_sign = this.userPrefs.timezone_offset[0];
      this.timezone_offset_hours = this.userPrefs.timezone_offset.slice(1,3);
      this.timezone_offset_minutes = this.userPrefs.timezone_offset.slice(3,5);
    }
    else {
      this.timezone_offset_sign = '';
      this.timezone_offset_hours = '';
      this.timezone_offset_minutes = '';
    }

    this.canUpdatePrefs = function() { return Session.hasPermission('users.update.allow'); };

    this.resetPrefrences = function() {
      ctrl.userPrefs.posts_per_page = 25;
      ctrl.userPrefs.threads_per_page = 25;
    };

    function savePreferences() {
      ctrl.userPrefs.username = ctrl.user.username;
      return User.update({ id: ctrl.user.id }, ctrl.userPrefs).$promise
      .then(function() { return PreferencesSvc.setPreferences(ctrl.userPrefs); })
      .then(function() { Alert.success('Successfully saved preferences'); })
      .catch(function() { Alert.error('Preferences could not be updated'); });
    };
    this.savePreferences = savePreferences;

    // handle timezone offset
    this.timezone_offset_sign_options = [
      { value: '', label: '+/-', disabled: true },
      { value: '+', label: '+' },
      { value: '-', label: '-' }
    ];
    this.timezone_offset_hours_options = [
      { value: '', label: 'HH', disabled: true },
      { value: '00', label: '00' },
      { value: '01', label: '01' },
      { value: '02', label: '02' },
      { value: '03', label: '03' },
      { value: '04', label: '04' },
      { value: '05', label: '05' },
      { value: '06', label: '06' },
      { value: '07', label: '07' },
      { value: '08', label: '08' },
      { value: '09', label: '09' },
      { value: '10', label: '10' },
      { value: '11', label: '11' },
      { value: '12', label: '12' },
      { value: '13', label: '13' },
      { value: '14', label: '14' }
    ];
    this.timezone_offset_minutes_options = [
      { value: '', label: 'MM', disabled: true },
      { value: '00', label: '00' },
      { value: '15', label: '15' },
      { value: '30', label: '30' },
      { value: '45', label: '45' }
    ];
    function timezoneOffsetValid() {
      return ctrl.timezone_offset_sign !== '' && ctrl.timezone_offset_hours !== '' && ctrl.timezone_offset_minutes !== '';
    }
    this.resetTimezoneOffset = function() {
      ctrl.timezone_offset_sign = '';
      ctrl.timezone_offset_hours = '';
      ctrl.timezone_offset_minutes = '';
      ctrl.userPrefs.timezone_offset = '';
      savePreferences();
    };
    this.saveTimezoneOffset = function() {
      if (timezoneOffsetValid()) {
        ctrl.userPrefs.timezone_offset = ctrl.timezone_offset_sign + ctrl.timezone_offset_hours + ctrl.timezone_offset_minutes;
        savePreferences();
      }
      else {
        Alert.error('All timezone fields must be filled!');
      }
    };
    this.timezoneOffsetValid = timezoneOffsetValid;

    this.toggleIgnoredBoard = function(boardId) {
      var index = ctrl.userPrefs.ignored_boards.indexOf(boardId);
      var oldIgnoredBoards = angular.copy(ctrl.userPrefs.ignored_boards);
      if (index > -1) { ctrl.userPrefs.ignored_boards.splice(index, 1); }
      else { ctrl.userPrefs.ignored_boards.push(boardId); }
      ctrl.userPrefs.username = ctrl.user.username;
      return User.update({ id: ctrl.user.id }, ctrl.userPrefs).$promise
      .then(function() { return PreferencesSvc.setPreferences(ctrl.userPrefs); })
      .catch(function() {
        ctrl.userPrefs.ignored_boards = oldIgnoredBoards;
        ctrl.allBoards[boardId] = !ctrl.allBoards[boardId];
        Alert.error('Preferences could not be updated');
      });
    };
  }
];

module.exports = angular.module('ept.settings.ctrl', [])
.controller('SettingsCtrl', ctrl)
.name;
