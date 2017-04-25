FROM node:7.4
WORKDIR /driver

# install container dependencies
RUN apt-get update
RUN apt-get install -y --no-install-recommends \
      curl \
      wget \
      vim \
      iptables \
      dpkg-dev \
      ssl-cert \
      openssh-client \
      libxml2 \
      git \
      python2.7 \
      python2.7-dev \
      python-pip \
      build-essential \
      libssl-dev \
      patch

# install project dependencies and build
ADD . /driver
RUN npm install
RUN npm run build

# expose appium driver port
EXPOSE 4723
# expose proxy port
EXPOSE 8080
# export remote debugging port
EXPOSE 9222

CMD ["npm", "run", "start:server"]
