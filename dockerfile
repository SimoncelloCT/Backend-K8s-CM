FROM node:14

WORKDIR /usr/src/app
COPY package*.json .
RUN npm i
COPY . .

EXPOSE 80

CMD ["node", "dist/Authorization/AuthorizationService/src/api.js"]