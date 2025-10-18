FROM node:18
COPY . .
RUN npm install
EXPOSE 300
CMD [ "node" ,"index.js" ]
