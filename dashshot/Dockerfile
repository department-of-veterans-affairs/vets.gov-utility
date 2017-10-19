FROM node:8-slim

# Run this like so:
# docker build -t dashshot . && docker run -it --rm -v "$(pwd)":/pdf dashshot


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

CMD ["node", "/app/index.js"]
