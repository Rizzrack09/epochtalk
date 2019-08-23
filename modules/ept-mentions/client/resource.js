var resource = ['$resource',
  function($resource) {
    return $resource('/api/mentions', {}, {
      page: {
        method: 'GET',
        params: {
          limit: '@limit',
          page: '@page'
        },
        ignoreLoadingBar: true
      },
      delete: {
        method: 'DELETE',
        params: {
          page: '@id'
        },
        ignoreLoadingBar: true
      },
      pageIgnoredUsers: {
        method: 'GET',
        url: '/api/mentions/ignored',
        ignoreLoadingBar: true,
      },
      ignoreUser: {
        method: 'POST',
        url: '/api/mentions/ignore',
        params: {
          username: '@username',
        },
        ignoreLoadingBar: true
      },
      unignoreUser: {
        method: 'POST',
        url: '/api/mentions/unignore',
        params: {
          username: '@username',
        },
        ignoreLoadingBar: true
      },
      enableMentionEmails: {
        method: 'PUT',
        url: '/api/mentions/settings'
      },
      getMentionEmailSettings: {
        method: 'GET',
        url: '/api/mentions/settings'
      }
    });
  }
];

angular.module('ept').factory('Mentions', resource);
