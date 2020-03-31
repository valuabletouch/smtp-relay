import os from 'os';
import fs from 'fs';

import { SMTPServer } from 'smtp-server';

import { simpleParser } from 'mailparser';

import nodemailer from 'nodemailer';

const listenHost = process.env.LISTEN_HOST;
const listenPort = process.env.LISTEN_PORT ? +process.env.LISTEN_PORT : 25;

const listenSecured = process.env.LISTEN_SECURED == 1;
const listenKeyPath = process.env.LISTEN_KEY_PATH;
const listenCertPath = process.env.LISTEN_CERT_PATH;

const listenAuthRequired = process.env.LISTEN_AUTH_REQUIRED == 1;
const listenUsername = process.env.LISTEN_USER;
const listenPassword = process.env.LISTEN_PASS;
const listenServerName = process.env.LISTEN_SERVER_NAME || os.hostname();
const listenBanner = process.env.LISTEN_BANNER;

const listenMaxSize = process.env.LISTEN_MAX_SIZE
  ? +process.env.LISTEN_MAX_SIZE
  : Infinity;

const listenSizeHidden = process.env.LISTEN_SIZE_HIDDEN == 1;

const listenMaxClients = process.env.LISTEN_MAX_CLIENTS
  ? +process.env.LISTEN_MAX_CLIENTS
  : 50;

const listenSocketTimeout = process.env.LISTEN_SOCKET_TIMEOUT
  ? +process.env.LISTEN_SOCKET_TIMEOUT
  : 60000;

const listenCloseTimeout = process.env.LISTEN_CLOSE_TIMEOUT
  ? +process.env.LISTEN_CLOSE_TIMEOUT
  : 30000;

const sendFrom = process.env.SEND_FROM;

const sendAuthType = process.env.SEND_AUTH_TYPE || 'login';

const sendHost = process.env.SEND_HOST;
const sendPort = process.env.SEND_PORT ? +process.env.SEND_PORT : 25;

const sendUseSSL = process.env.SEND_USE_SSL == 1;
const sendUseTLS = process.env.SEND_USE_TLS == 1;

const sendUsername = process.env.SEND_USER;
const sendPassword = process.env.SEND_PASS;

const sendClientId = process.env.SEND_CLIENT_ID;
const sendClientSecret = process.env.SEND_CLIENT_SECRET;
const sendRefreshToken = process.env.SEND_REFRESH_TOKEN;
const sendAccessUrl = process.env.SEND_ACCESS_URL;
const sendServiceClientId = process.env.SEND_SERVICE_CLIENT_ID;
const sendServiceClientPrivateKey = process.env.SEND_SERVICE_CLIENT_PRIVATE_KEY;

const sendPooling = process.env.SEND_POOLING == 1;

const sendRateDelta = process.env.SEND_RATE_DELTA
  ? +process.env.SEND_RATE_DELTA
  : 60000;

const sendRateLimit = process.env.SEND_RATE_LIMIT
  ? +process.env.SEND_RATE_LIMIT
  : 75;

const sendMaxConnections = process.env.SEND_MAX_CONNECTIONS
  ? +process.env.SEND_MAX_CONNECTIONS
  : 5;

const sendMaxMessagesPerConnection = process.env
  .SEND_MAX_MESSAGES_PER_CONNECTION
  ? +process.env.SEND_MAX_MESSAGES_PER_CONNECTION
  : 100;

const sendDebug = process.env.SEND_DEBUG == 1;

const transport = nodemailer.createTransport({
  host: sendHost,
  port: sendPort,
  secure: sendUseSSL, // use TLS
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
  key: listenSecured ? fs.readFileSync(listenKeyPath) : null,
  cert: listenSecured ? fs.readFileSync(listenCertPath) : null,
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
              scope: 'my_smtp_access_scope_name'
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

      if (data.to && data.to.text) {
        data.to = data.to.text;
      }

      if (data.cc && data.cc.text) {
        data.cc = data.cc.text;
      }

      if (data.bcc && data.bcc.text) {
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
