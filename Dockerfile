# Build
FROM node AS build

WORKDIR /src

COPY . .

RUN npm i

# Image
FROM node

LABEL maintainer="yasin.akar@vtc.com.tr"

WORKDIR /app

COPY --from=build /src/src ./src

COPY --from=build /src/node_modules ./node_modules

COPY --from=build /src/package.json .

COPY --from=build /src/babel.config.js .

ENTRYPOINT ["npm", "start"]

CMD []
