import os from 'os';
import fs from 'fs';

import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { createTransport } from 'nodemailer';

function getNumber(val, defaultVal) {
  return val ? +val : defaultVal;
}

function getBoolean(val) {
  return   val == 1 || val === 'true' || val === true;
}

const listenHost = process.env.LISTEN_HOST;
const listenPort = getNumber(process.env.LISTEN_PORT, 25);

const listenSecured = getBoolean(process.env.LISTEN_SECURED);

const listenKey = process.env.LISTEN_KEY;
const listenCert = process.env.LISTEN_CERT;

const listenKeyPath = process.env.LISTEN_KEY_PATH;
const listenCertPath = process.env.LISTEN_CERT_PATH;

const listenAuthRequired = getBoolean(process.env.LISTEN_AUTH_REQUIRED);

const listenUsername = process.env.LISTEN_USER;
const listenPassword = process.env.LISTEN_PASS;
const listenServerName = process.env.LISTEN_SERVER_NAME || os.hostname();
const listenBanner = process.env.LISTEN_BANNER;

const listenMaxSize = getNumber(process.env.LISTEN_MAX_SIZE, Infinity);
const listenSizeHidden = getBoolean(process.env.LISTEN_SIZE_HIDDEN);

const listenMaxClients = getNumber(process.env.LISTEN_MAX_CLIENTS, 50);

const listenSocketTimeout = getNumber(process.env.LISTEN_SOCKET_TIMEOUT, 60000);
const listenCloseTimeout = getNumber(process.env.LISTEN_CLOSE_TIMEOUT, 30000);

const sendFrom = process.env.SEND_FROM;

const sendAuthType = process.env.SEND_AUTH_TYPE || 'login';

const sendHost = process.env.SEND_HOST;
const sendPort = getNumber(process.env.SEND_PORT, 25);

const sendUseSSL = getBoolean(process.env.SEND_USE_SSL);
const sendUseTLS = getBoolean(process.env.SEND_USE_TLS);

const sendUsername = process.env.SEND_USER;
const sendPassword = process.env.SEND_PASS;

const sendClientId = process.env.SEND_CLIENT_ID;
const sendClientSecret = process.env.SEND_CLIENT_SECRET;
const sendRefreshToken = process.env.SEND_REFRESH_TOKEN;
const sendAccessUrl = process.env.SEND_ACCESS_URL;
const sendServiceClientId = process.env.SEND_SERVICE_CLIENT_ID;
const sendServiceClientPrivateKey = process.env.SEND_SERVICE_CLIENT_PRIVATE_KEY;

const sendPooling = getBoolean(process.env.SEND_POOLING);

const sendRateDelta = getNumber(process.env.SEND_RATE_DELTA, 60000);
const sendRateLimit = getNumber(process.env.SEND_RATE_LIMIT, 75);
const sendMaxConnections = getNumber(process.env.SEND_MAX_CONNECTIONS, 5);
const sendMaxMessagesPerConnection = getNumber(process.env.SEND_MAX_MESSAGES_PER_CONNECTION, 100);

const sendDebug = getBoolean(process.env.SEND_DEBUG);

let serverKey = null;
let serverCert = null;

if (listenSecured) {
  if (listenKey) {
    serverKey = listenKey;
  }
  else if (listenKeyPath) {
    serverKey = fs.readFileSync(listenKeyPath);
  }

  if (listenCert) {
    serverCert = listenCert;
  }
  else if (listenCertPath) {
    serverCert = fs.readFileSync(listenCertPath);
  }
}

const transport = createTransport({
  host: sendHost,
  port: sendPort,
  secure: sendUseSSL, // use SSL
  requireTLS: sendUseTLS, // force the client to use STARTTLS
  tls: {
    rejectUnauthorized: false // Do not fail on invalid certs
  },
  auth: {
    type: sendAuthType,
    user: sendUsername,
    pass: sendPassword,
    clientId: sendClientId,
    clentSecret: sendClientSecret,
    refreshToken: sendRefreshToken,
    accessUrl: sendAccessUrl,
    serviceClient: sendServiceClientId,
    privateKey: sendServiceClientPrivateKey
  },
  pool: sendPooling,
  maxConnections: sendMaxConnections,
  maxMessages: sendMaxMessagesPerConnection,
  rateDelta: sendRateDelta,
  rateLimit: sendRateLimit,
  debug: sendDebug
});

const server = new SMTPServer({
  secure: listenSecured,
  key: serverKey,
  cert: serverCert,
  name: listenServerName,
  banner: listenBanner,
  size: listenMaxSize,
  hideSize: listenSizeHidden,
  authMethods: ['PLAIN', 'LOGIN', 'XOAUTH2'],
  authOptional: !listenAuthRequired,
  allowInsecureAuth: listenAuthRequired && !listenSecured,
  disabledCommands: [],
  disableReverseLookup: true,
  logger: true,
  maxClients: listenMaxClients,
  socketTimeout: listenSocketTimeout,
  closeTimeout: listenCloseTimeout,

  onAuth(auth, session, callback) {
    if (listenAuthRequired) {
      if (
        auth.username !== listenUsername ||
        auth.password !== listenPassword
      ) {
        if (auth.method === 'XOAUTH2') {
          return callback(null, {
            data: {
              status: '401',
              schemes: 'bearer mac',
              scope: 'email'
            }
          });
        }

        return callback(new Error('Invalid username or password.'));
      }
    }

    callback(null, { user: listenUsername });
  },

  async onData(stream, session, callback) {
    try {
      const data = await simpleParser(stream);

      data.from = sendFrom;

      if (data.to?.text) {
        data.to = data.to.text;
      }

      if (data.cc?.text) {
        data.cc = data.cc.text;
      }

      if (data.bcc?.text) {
        data.bcc = data.bcc.text;
      }

      try {
        await transport.sendMail(data);

        callback();
      }
      catch (reason) {
        console.error('Error on sendMail:', reason);

        callback(reason);
      }
    } catch (reason) {
      console.error('Error on simpleParser:', reason);

      callback(reason);
    }
  }
});

server.on('error', err => {
  console.error('Error on SMTPServer:', err);
});

server.listen(listenPort, listenHost, err => {
  if (err) {
    console.error('Error on SMTPServer startup:', err);
  }
});
