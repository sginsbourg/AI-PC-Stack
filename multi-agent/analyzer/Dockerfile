FROM node:20
WORKDIR taxation /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "analyzer.js"]