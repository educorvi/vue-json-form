FROM node:lts-alpine as build-stage
RUN corepack enable
WORKDIR /app
COPY ../package.json .
COPY ../yarn.lock .
COPY ../.yarnrc.yml .
COPY ../.yarn .yarn

WORKDIR /app/vue-json-form
COPY ../vue-json-form/package.json .

WORKDIR /app/demo
COPY ../demo/package.json .

WORKDIR /app/webcomponent
COPY ../webcomponent/package.json .

WORKDIR /app
RUN yarn workspaces focus demo

COPY .. .

RUN yarn workspaces focus demo

RUN yarn workspaces foreach -Rpt --from demo run build

FROM nginx:stable-alpine as demo
RUN mkdir /app
COPY --from=build-stage /app/demo/dist /app
COPY docker/nginx.conf /etc/nginx/nginx.conf
