import Promise from "bluebird";
import { strictEqual } from "assert";
import { rejects } from "assert-exception";

import {
  createIoServerAsync,
  createIoClientAsync,
  createSession
} from "./test-helpers";
import firebaseAdmin from "firebase-admin";
import createFirebaseAdminMiddlware from "./";
import credential from "./.credential";

let app, middleware, server, port;
it.before(async () => {
  app = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(credential)
  });
  middleware = createFirebaseAdminMiddlware(app);
  server = await createIoServerAsync(middleware);
  port = server.address().port;
});
it.after(async () => {
  app.delete();
  server.destroy();
});

it("should deny unauthorized user using deny mode(default)", async () => {
  const error = await rejects(createIoClientAsync(port));
  const expectMessage = "Decoding Firebase session cookie failed";
  strictEqual(error.message.slice(0, expectMessage.length), expectMessage);
});

it(
  "should allow authorized user, and middleware have user claims cache(default)",
  async () => {
    const session = await createSession(
      middleware,
      "CUCPCuD50xgKeEfVggJ1fYQYNOj1"
    );
    server.io.on("connect", client => {
      client.on("claims", resolve => {
        resolve(middleware.getCache(client));
      });
    });

    const client = await createIoClientAsync(port, { session });
    await new Promise(async resolve => {
      client.emit("claims", claims => {
        strictEqual(claims.email, "i59naga@icloud.com");
        client.close();
        resolve();
      });
    });
  },
  { timeout: 3000 }
);
