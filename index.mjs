export default (app, options = {}) => {
  const auth = app.auth();
  const opts = Object.assign({ deny: true, cache: true }, options);

  const cache = {};
  const middleware = async (client, next) => {
    const { session = "" } = client.handshake.query;
    if (!session && !opts.deny) {
      return next();
    }

    try {
      const claims = await auth.verifySessionCookie(session, true);
      if (opts.cache) {
        middleware.setCache(client, claims);
        client.on("disconnect", () => {
          middleware.deleteCache(client);
        });
      }
    } catch (error) {
      if (opts.deny) {
        return next(error);
      }
    }
    next();
  };
  middleware.setCache = (client, value) => {
    return (cache[client.id] = value);
  };
  middleware.getCache = client => {
    return cache[client.id];
  };
  middleware.deleteCache = client => {
    delete cache[client.id];
  };

  middleware.extra = {
    verifyCustomTokenUrl:
      "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=",
    createCustomToken: (...args) => auth.createCustomToken(...args),
    createSessionCookie: (...args) => auth.createSessionCookie(...args)
  };

  return middleware;
};
