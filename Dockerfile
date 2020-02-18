# Build
FROM node AS build

WORKDIR /src

COPY . .

USER root

RUN rm -f yarn.lock

RUN yarn install --ignore-engines

# Image
FROM node

LABEL maintainer="yasin.akar@vtc.com.tr"

WORKDIR /app

COPY --from=build /src/src ./src

COPY --from=build /src/node_modules ./node_modules

COPY --from=build /src/package.json .

COPY --from=build /src/.babelrc .

USER root

ENTRYPOINT ["yarn", "start"]
