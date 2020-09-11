module.exports = {
  method: 'GET',
  path: '/recover',
  handler: function(request, h) {
    var config = request.server.app.config;
    var ip = request.info.remoteAddress;
    var data = {
      title: config.website.title,
      description: config.website.description,
      keywords: config.website.keywords,
      logo: config.website.logo,
      favicon: config.website.favicon,
      siteKey: config.recaptchaSiteKey,
      GAKey: config.gaKey,
      google_api_key: config.googleAPIKey,
      google_client_id: config.googleClientId,
      google_app_domain: config.googleAppDomain,
      lockout: JSON.stringify(request.server.plugins.backoff.getLockoutTimes()),
    };
    return request.server.plugins.backoff.getAccessLogs(request.db.db, ip)
    .then(function(attempts) {
      data.attempts = JSON.stringify(attempts);
      return h.view('recover', data);
    });
  }
};
