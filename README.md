# SMTP Relay
A simple SMTP server which works as a relay.

## Usage
```
yarn install

yarn start
```

## Docker
You can use this sample docker-compose file
```yaml
version: '3.5'

services:
  smtp-relay:
    image: valuabletouch/smtp-relay
    environment:
      - LISTEN_PORT=465
      - LISTEN_AUTH_REQUIRED=1
      - LISTEN_USER=smtp
      - LISTEN_PASS=smtp
      - LISTEN_SERVER_NAME=my-smtp-server
      - SEND_FROM=from@example.com
      - SEND_HOST=smtp.example.com
      - SEND_PORT=465
      - SEND_AUTH_TYPE=login
      - SEND_USER=usename
      - SEND_PASS=password
      - SEND_POOLING=1
    ports:
      - 465:465

```

### All Environment Variables
Variable | Default Value | Description
--- | --- | ---
**LISTEN_HOST** | `0.0.0.0` | Relay server host to listen
**LISTEN_PORT** | `25` | Relay server port to listen
**LISTEN_SECURED** | `0` | If set to 1 then relay server will use TLS. A volume must be mounted containing  key and certificate files, also `LISTEN_KEY_PATH` and `LISTEN_CERT_PATH` values must be supported 
**LISTEN_KEY_PATH** | `null` | File path for key file
**LISTEN_CERT_PATH** | `null` | File path for certificate file
**LISTEN_AUTH_REQUIRED** | `0` | If set to 1 then relay server will require authentication. `LISTEN_USER` and `LISTEN_PASS` values must be supported
**LISTEN_USER** | `renders` | Relay server authentication username
**LISTEN_PASS** | `renders` | Relay server authentication password
**LISTEN_SERVER_NAME** | `os.hostname()` | Relay server hostname, used for identifying to the client
**LISTEN_BANNER** | `null` | Relay server greeting message. This message is appended to the default ESMTP response.
**LISTEN_MAX_SIZE** | `Infinity` | Relay server maximum allowed message size in bytes
**LISTEN_SIZE_HIDDEN** | `0` | If set to 0 then does not expose the max allowed size to the client but keeps size related values like stream.sizeExceeded
**LISTEN_MAX_CLIENTS** | `50` | Relay server maximum number of concurrently connected clients
**LISTEN_SOCKET_TIMEOUT** | `60000` | How many milliseconds of inactivity to allow before disconnecting the client on relay server
**LISTEN_CLOSE_TIMEOUT** | `30000` | How many millisceonds to wait before disconnecting pending connections once relay server close has been called
**SEND_FROM** | `null` | Send e-mail from address
**SEND_AUTH_TYPE** | `login` | Send e-mail authetication type
**SEND_HOST** | `null` | Send e-mail SMTP host
**SEND_PORT** | `25` | Send e-mail SMTP port
**SEND_USER** | `renders` | Send e-mail authentication username
**SEND_PASS** | `renders` | Send e-mail authentication password
**SEND_CLIENT_ID** | `null` | Send e-mail authentication client_id, usually required when authetication type is `oauth2`
**SEND_CLIENT_SECRET** | `null` | Send e-mail authentication client_secret, usually required when authetication type is `oauth2`
**SEND_REFRESH_TOKEN** | `null` | Send e-mail authentication refresh_token, used when authetication type is `oauth2`
**SEND_ACCESS_URL** | `null` | Send e-mail HTTP endpoint for requesting new access tokens, used when authetication type is `oauth2`
**SEND_POOLING** | `0` | If set to 1 then use pooled connections instead of creating a new connection for every email when sending e-mail
**SEND_RATE_DELTA** | `60000` | Defines the time measuring period in milliseconds for rate limiting
**SEND_RATE_LIMIT** | `75` | Limits the message count to be sent in `SEND_RATE_DELTA` time. Once `SEND_RATE_LIMIT` is reached, sending is paused until the end of the measuring period. This limit is shared between connections, so if one connection uses up the limit, then other connections are paused as well. If `SEND_RATE_LIMIT` is not set then sending rate is not limited
**SEND_MAX_CONNECTIONS** | `5` | The count of maximum simultaneous connections to make against the SMTP server when sending e-mail
**SEND_MAX_MESSAGES_PER_CONNECTION** | `100` | Limits the message count to be sent using a single connection when sending e-mail. After maxMessages is reached the connection is dropped and a new one is created for the following messages

## License
[MIT](/LICENSE)