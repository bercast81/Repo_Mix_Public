FROM node:20-alpine3.19

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./
COPY prisma ./prisma  

RUN npm install

RUN npx prisma generate --schema=./prisma/schema.prisma



COPY . .

EXPOSE 3002