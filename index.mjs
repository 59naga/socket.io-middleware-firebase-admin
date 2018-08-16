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
        middleware.setCache(client.id, claims);
        client.on("disconnect", () => {
          middleware.deleteCache(client.id);
        });
      }
    } catch (error) {
      if (opts.deny) {
        return next(error);
      }
    }
    next();
  };
  middleware.setCache = (key, value) => {
    return (cache[key] = value);
  };
  middleware.getCache = key => {
    return cache[key];
  };
  middleware.deleteCache = key => {
    delete cache[key];
  };

  middleware.extra = {
    verifyCustomTokenUrl:
      "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=",
    createCustomToken: (...args) => auth.createCustomToken(...args),
    createSessionCookie: (...args) => auth.createSessionCookie(...args)
  };

  return middleware;
};
