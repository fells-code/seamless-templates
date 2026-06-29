# Dev-focused container for Express API
# NOT a production image
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm i

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

