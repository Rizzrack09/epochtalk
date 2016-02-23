'use strict';
/* jslint node: true */

module.exports = ['$resource',
  function($resource) {
    return $resource('/api/notifications/:id', {}, {
      dismiss: {
        params: { type: '@type' },
        method: 'POST',
        url: '/api/notifications'
      },
      counts: {
        method: 'GET',
        url: '/api/notifications/counts'
      }
    });
  }
];
