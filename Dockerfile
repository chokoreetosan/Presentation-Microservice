FROM node:current-alpine
COPY / /presentation
WORKDIR /presentation
RUN apk add git
ENV DB_HOST 
ENV DB_PORT 3306
ENV DB_USER admin
ENV DB_PASS password
EXPOSE 8081
RUN npm install
RUN npm run dbinit
CMD ["npm", "start"]

