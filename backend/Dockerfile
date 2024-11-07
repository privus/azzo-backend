# Usar a imagem do Node.js baseada no Alpine
FROM node:18-alpine

# Definir o diretório de trabalho no container
WORKDIR /usr/src/app

ENV DB_TYPE=mysql
ENV DB_HOST=database-azzo.cj46y6k2uqf8.sa-east-1.rds.amazonaws.com
ENV DB_PORT=3306
ENV DB_USERNAME=user
ENV DB_PASSWORD=senha123
ENV DB_NAME=database-azzo
ENV DB_LOGGING=true
ENV PORT=3000
ENV JWT_SECRET=Yyh6NmrK5q38gjMd6HB5XPXDY4
ENV JWT_EXPIRES_IN=5h


# Copiar o package.json e o package-lock.json
COPY package*.json ./

# Instalar as dependências
RUN npm install

# Copiar o código do projeto
COPY . .

# Expor a porta usada pelo NestJS
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["npm", "run", "start:dev"]
