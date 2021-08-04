FROM ubuntu:20.04
ENV DEBIAN_FRONTEND="noninteractive"
RUN apt-get -y update
RUN apt-get -y upgrade

RUN apt-get -y install curl software-properties-common
RUN add-apt-repository universe
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN curl https://bootstrap.pypa.io/pip/2.7/get-pip.py --output get-pip.py
# TODO: CLEANUP
# RUN apt-get -y remove curl
RUN apt-get -y update

RUN apt-get -y install nodejs mongodb nginx imagemagick libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev ffmpeg python2 libgeoip-dev git
RUN npm install -g npm@7.19.1
RUN python2 get-pip.py
RUN rm get-pip.py

RUN useradd -ms /bin/bash livechan

RUN ln -s /usr/bin/python2 /usr/local/bin/python
WORKDIR /home/livechan
USER livechan

COPY --chown=livechan:livechan package.json .
# RUN npm outdated --all
# RUN cat package.json
ARG MAXMIND_LICENSE_KEY
RUN npm install

COPY --chown=livechan:livechan requirements.txt .
RUN pip install -r requirements.txt

COPY --chown=livechan:livechan scripts/ ./scripts/
COPY --chown=livechan:livechan public/ ./public/
COPY --chown=livechan:livechan pages/ ./pages/
RUN ./scripts/stickers.py
# TODO: MERGE pip
RUN ./scripts/tripflags.py
RUN ./scripts/banners.py
RUN ./scripts/smiles.py
COPY --chown=livechan:livechan bower.json .
RUN ./scripts/build_client_js.sh

COPY --chown=livechan:livechan lib/ ./lib/
COPY --chown=livechan:livechan config.js .
CMD node lib/index.js
