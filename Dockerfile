FROM nginx
MAINTAINER shn@glucose.jp

RUN rm /etc/nginx/conf.d/default.conf
ADD ./etc/docker/nginx/naumanni.conf /etc/nginx/conf.d/
ADD ./www/index.html ./www/favicon.ico /var/www/naumanni/
ADD ./static /var/www/naumanni/static

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
