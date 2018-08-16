import Promise from "bluebird";
import request from "request";

import { createServer } from "http";
import enableDestroy from "server-destroy";
import createIoServer from "socket.io";
import createIoClient from "socket.io-client";

import credential from "./.credential";

export const requestAsync = Promise.promisify(request, { multiArgs: true });

// emulate the `user.getIdToken()` of client side
export const createSession = async (middleware, uid) => {
  const {
    createCustomToken,
    verifyCustomTokenUrl,
    createSessionCookie
  } = middleware.extra;

  const customToken = await createCustomToken(uid);
  const [, { idToken }] = await requestAsync({
    url: verifyCustomTokenUrl + credential.auth_key,
    method: "POST",
    body: {
      token: customToken,
      returnSecureToken: true
    },
    json: true
  });

  const MIN = 60 * 1000;
  return await createSessionCookie(idToken, { expiresIn: 5 * MIN });
};

export const createIoServerAsync = ioMiddleware => {
  return new Promise(resolve => {
    const server = createServer();
    server.io = createIoServer(server);
    server.io.use(ioMiddleware);
    server.listen(() => {
      enableDestroy(server);
      resolve(server);
    });
  });
};

export const createIoClientAsync = (port, cookie) => {
  return new Promise((resolve, reject) => {
    const client = createIoClient(`http://localhost:${port}`, {
      extraHeaders: {
        Cookie: cookie
      }
    });
    client.on("connect", () => {
      resolve(client);
    });
    client.on("error", error => {
      client.close();
      reject(typeof error === "string" ? new Error(error) : error);
    });
  });
};
