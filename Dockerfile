FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p public/images/uploads

EXPOSE 3000

CMD ["sh", "-c", "node scripts/migrate.js && node src/app.js"]
