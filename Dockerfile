FROM node:0.10

EXPOSE 3000

RUN apt-get update && apt-get install -y curl build-essential

RUN curl https://install.meteor.com/ | sh

RUN mkdir -p /opt/src && mkdir -p /opt/app
WORKDIR /opt/src
ADD . /opt/src
RUN meteor build --directory /opt/app && cd /opt/app/bundle/programs/server && npm install
WORKDIR /opt/app/bundle
ENV PORT 3000
ENV MONGO_URL mongodb://mongo
ENV ROOT_URL http://localhost:3000
CMD node main.js
