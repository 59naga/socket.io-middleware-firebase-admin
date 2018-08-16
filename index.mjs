import firebaseAdmin from "firebase-admin";
import cookie from "cookie";

export default ({ credential }, options = {}) => {
  const app = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(credential)
  });
  const auth = firebaseAdmin.auth();
  const opts = Object.assign({ deny: true, cache: true }, options);

  const cache = {};
  const middleware = async (client, next) => {
    const { session = "" } = cookie.parse(
      client.handshake.headers.cookie || ""
    );
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
  middleware.firebaseAdminClose = () => {
    app.delete();
  };

  middleware.extra = {
    verifyCustomTokenUrl:
      "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=",
    createCustomToken: (...args) => auth.createCustomToken(...args),
    createSessionCookie: (...args) => auth.createSessionCookie(...args)
  };

  return middleware;
};
