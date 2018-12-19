Socket.io Middleware firebase-admin
---

<p align="right">
  <a href="https://www.npmjs.com/package/socket.io-middleware-firebase-admin">
    <img alt="Npm version" src="https://badge.fury.io/js/socket.io-middleware-firebase-admin.svg">
  </a>
  <a href="https://travis-ci.org/59naga/socket.io-middleware-firebase-admin">
    <img alt="Build Status" src="https://travis-ci.org/59naga/socket.io-middleware-firebase-admin.svg?branch=master">
  </a>
</p>

a socket.io middleware [firebaseAdmin.verifySessionCookie](https://firebase.google.com/docs/auth/admin/manage-cookies)

Installation
---
```
yarn add socket.io-middleware-firebase-admin
```

API
---

## createIoMiddlewareFirebaseAdmin(app, options = {}): middleware

```js
import { createServer } from "http";
import createIoServer from "socket.io";
import createIoClient from "socket.io-client";

import createIoMiddlewareFirebaseAdmin from "socket.io-middleware-firebase-admin";
import credential from "./.credential";

const server = createServer();
const io = createIoServer(server);
const app = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(credential)
});
const ioMiddleware = createIoMiddlewareFirebaseAdmin(app);

io.use(ioMiddleware);

server.listen(() => {
  const { port } = server.address();
  const client = createIoClient(`http://localhost:${port}`, {
    query: {
      session: ""//await firebaseAdmin.auth().createSessionCookie(idToken)
    }
  });
  client.on("connect", error => {
    const decodedClaims = ioMiddleware.getCache(client);
    console.log(decodedClaims);
  });
});
```

### `options`

* `options.deny`= true: boolean
  Deny connections of users who couldn't authenticate.

* `options.cache`= true: boolean
  Cache claim of authenticated user.

## ioMiddleware.getCache(client): decodedClaims

Returns the claim of the authenticated user.

```js
console.log(ioMiddleware.getCache(client));
// { iss:
//    'https://session.firebase.google.com/socketio-middleware-demo1',
//   aud: 'socketio-middleware-demo1',
//   auth_time: 1534417139,
//   user_id: 'CUCPCuD50xgKeEfVggJ1fYQYNOj1',
//   sub: 'CUCPCuD50xgKeEfVggJ1fYQYNOj1',
//   iat: 1534417140,
//   exp: 1534417440,
//   email: 'i59naga@icloud.com',
//   email_verified: false,
//   firebase:
//    { identities: { email: [Array] }, sign_in_provider: 'custom' }
```

License
---
MIT
