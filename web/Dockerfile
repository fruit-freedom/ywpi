FROM node:lts AS build

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install

COPY . .
RUN npx vite build

FROM nginx:alpine

COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/dist .

ENTRYPOINT ["nginx", "-g", "daemon off;"]
