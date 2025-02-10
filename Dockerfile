# Usar a imagem do Node.js baseada no Alpine
FROM node:18

# Definir o diretório de trabalho no container
WORKDIR /usr/src/app

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
