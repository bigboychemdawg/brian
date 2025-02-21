FROM node:18

WORKDIR /app

COPY package*.json ./

COPY . .

RUN npm install

RUN apt-get update && \
    apt-get install -y cron supervisor && \
    rm -rf /var/lib/apt/lists/*

RUN echo "*/20 * * * * root node /app/script.js >> /proc/1/fd/1 2>&1" >> /etc/crontab

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
