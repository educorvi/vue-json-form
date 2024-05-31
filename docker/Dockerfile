FROM node:lts as build-stage
RUN corepack enable
WORKDIR /app
COPY .. .
RUN yarn install
WORKDIR /app/vue-json-form
RUN yarn run build
WORKDIR /app/demo
RUN yarn run build

FROM nginx:stable-alpine as demo
RUN mkdir /app
COPY --from=build-stage /app/demo/dist /app
COPY docker/nginx.conf /etc/nginx/nginx.conf
