FROM node:9-slim

# Run this like so:
# docker build -t dashshot . && docker run -it --rm -v "$(pwd)":/pdf dashshot

# Match the jenkins uid/gid on the host (504)
RUN groupadd --gid 504 jenkins \
  && useradd --uid 504 --gid jenkins --shell /bin/bash --create-home jenkins

# Install latest chrome dev package and pdf utility
RUN apt-get update && apt-get install -y wget --no-install-recommends \
    && apt-get install -y pdftk \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb

WORKDIR /app
COPY package.json yarn.lock ./

# Install deps
RUN yarn install --pure-lockfile

COPY index.js .

WORKDIR /pdf

COPY . .

RUN chown -R jenkins:jenkins /app /pdf
RUN chmod -R 777 /app /pdf
USER jenkins

CMD ["node", "/app/index.js"]
