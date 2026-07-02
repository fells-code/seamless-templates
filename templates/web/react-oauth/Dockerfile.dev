# Dev-focused container for Vite + React
# This is NOT a production image
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5001

CMD ["npm", "run", "dev", "--", "--host"]